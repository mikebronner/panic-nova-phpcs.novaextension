exports.activate = function() {
    if (nova.config.get('genealabs.phpcs.debugging', 'boolean')) {
        console.log("Extension activated.");
    }

    var process2 = new Process("/usr/bin/env", {
        args: ["chmod", "+x", "Bin/phpcs"],
        shell: true
    });
    process2.onStderr(function(line) {console.error(line);});
    process2.start();
}

exports.deactivate = function() {
    // Clean up state before the extension is deactivated
    if (nova.config.get('genealabs.phpcs.debugging', 'boolean')) {
        console.log("Extension is being deactivated.");
    }
}

class IssuesProvider {
    constructor() {
        this.showInstalledStandards();
    }

    getStandard() {
        let customStandard = nova.path.join(nova.workspace.path, "phpcs.xml");
        let projectStandard = nova.workspace.config.get(
            'genealabs.phpcs.standard',
            'string'
        );
        let globalStandard = nova.config.get(
            'genealabs.phpcs.standard',
            'string'
        );
        let defaultStandard = "PSR1,PSR2,PSR12";

        customStandard = nova.fs.stat(customStandard) != undefined
            ? customStandard
            : null;
        let selectedStandard = (((projectStandard || customStandard) || globalStandard) || defaultStandard);

        if (nova.config.get('genealabs.phpcs.debugging', 'boolean')) {
            console.log("Determined linting standard: ", selectedStandard);
        }

        return selectedStandard;
    }

    provideIssues(editor) {
        this.issues = [];
        let output = "";
        let self = this;
        let range = new Range(0, editor.document.length);
        let documentText = editor.getTextInRange(range);

        return new Promise(function (resolve) {
            try {
                let executablePath = self.getExecutablePath();

                if (nova.config.get('genealabs.phpcs.debugging', 'boolean')) {
                    console.log("Executable Path", executablePath);
                    console.log("Working Directory", nova.path.dirname(executablePath));
                }

                self.linter = new Process('/usr/bin/env', {
                    args: [
                        executablePath,
                        '-',
                        '-q',
                        '--report=json',
                        '--standard=' + self.getStandard(),
                    ],
                    shell: true,
                    stdio: ["pipe", "pipe", "pipe"],
                });

                self.linter.onDidExit(function () {
                    output = output.trim();

                    if (output.length === 0) {
                        return resolve([]);
                    }

                    if (! self.outputIsJson(output)) {
                        let issue = new Issue();
                        let matches = output.match(/line (\d+)/i);

                        if ((matches || []).length <= 1) {
                            return;
                        }

                        issue.message = output;
                        issue.severity = IssueSeverity.Error;
                        issue.line = matches[1];
                        issue.code = "phpcs";
                        issue.endLine = issue.line + 1;

                        if (nova.config.get('genealabs.phpcs.debugging', 'boolean')) {
                            console.log("Found error lint:");
                            console.log("===========");
                            console.log("Line: " + issue.line);
                            console.log("Message: " + lint.message);
                            console.log("Severity: " + lint.severity);
                            console.log("Code: " + lint.code);
                            console.log("===========");
                        }

                        return resolve([issue]);
                    }

                    if (nova.config.get('genealabs.phpcs.debugging', 'boolean')) {
                        console.log("Output:", output);
                    }

                    resolve(self.parseLinterOutput(editor, output));

                    if (nova.config.get('genealabs.phpcs.debugging', 'boolean')) {
                        console.log("Finished linting.");
                    }

                    output = "";
                });

                if (((self.linter || {}).stdin || false) === false) {
                    return;
                }

                self.writer = self.linter.stdin.getWriter();

                self.linter.onStderr(function (error) {
                    console.error(error);
                });

                self.linter.onStdout(function (line) {
                    output += line;
                });

                if (nova.config.get('genealabs.phpcs.debugging', 'boolean')) {
                    console.log("Started linting " + editor.document.path);
                }

                self.linter.start();

                self.writer.ready.then(function () {
                    let range = new Range(0, editor.document.length);
                    let documentText = editor.getTextInRange(range);

                    self.writer.write(documentText);
                });
                self.writer.ready.then(function () {
                    self.writer.close();
                });
            } catch (error) {
                console.error(error);
            }
        });
    }

    parseLinterOutput(editor, output) {
        if (! (editor || false)) {
            return;
        }

        let range = new Range(0, editor.document.length);
        let documentText = editor.getTextInRange(range);
        let codeLines = documentText.split("\n");
        let self = this;
        let lints = JSON.parse(output);
        let issues = Object
            .entries(lints.files)
            .flatMap(function ([path, lint]) {
                return lint.messages;
            })
            .map(function (lint) {
                let code = codeLines[lint.line - 1];
                let columnRange = self.getColumnRange(lint, code);
                let issue = new Issue();

                issue.message = lint.message;
                issue.code = lint.source + " | phpcs";
                issue.severity = IssueSeverity.Warning;

                if (lint.type === "ERROR") {
                    issue.severity = IssueSeverity.Error;
                }

                issue.line = lint.line;
                issue.endLine = lint.line;
                issue.column = columnRange.start;
                issue.endColumn = columnRange.end;

                if (nova.config.get('genealabs.phpcs.debugging', 'boolean')) {
                    console.log("Found lint:");
                    console.log("===========");
                    console.log("Line Of Code: |" + code + "|");
                    console.log("Line: " + lint.line);
                    console.log("Start Column: " + lint.column);
                    console.log("Calculated Start Column: " + columnRange.start);
                    console.log("Calculated End Column: " + columnRange.end);
                    console.log("Message: " + lint.message);
                    console.log("Source: " + lint.source);
                    console.log("Type: " + lint.type);
                    console.log("===========");
                }

                return issue;
            });

        return issues;
    }

    getExecutablePath()
    {
        let globalExecutable = nova.config
            .get("genealabs.phpcs.executablePath", "string")
            .trim();
        let projectExecutable = nova.workspace
            .config
            .get("genealabs.phpcs.executablePath", "string")
            .trim();
        let bundledExecutable = nova.path.join(
            nova.extension.path,
            "Bin",
            "phpcs"
        );

        if (
            globalExecutable.length > 0
            && globalExecutable.charAt() !== "/"
        ) {
            globalExecutable = nova.path.join(
                nova.workspace.path,
                globalExecutable
            );
        }

        if (
            projectExecutable.length > 0
            && projectExecutable.charAt() !== "/"
        ) {
            projectExecutable = nova.path.join(
                nova.workspace.path,
                projectExecutable
            );
        }

        let path = projectExecutable
            || globalExecutable
            || bundledExecutable;

        if (nova.config.get('genealabs.phpcs.debugging', 'boolean')) {
            console.log("Executable Path", path);
        }

        return path;
    }

    getLineOfCode(documentText, lineNumber)
    {
        return documentText.split("\n")[lineNumber - 1];
    }

    getColumnRange(lint, code)
    {
        let column = lint.column;
        let endColumn = lint.column + 1;
        let characterCode = code.charCodeAt(column);

        if (this.characterIsWhitespace(characterCode)) {
            for (let index = column; index < code.length; index++) {
                characterCode = code.charCodeAt(index);

                if (! this.characterIsWhitespace(characterCode)) {
                    break;
                }

                endColumn = index + 2;
            }
        } else if (
            this.characterIsAlphaNumeric(characterCode)
            || this.characterIsSymbol(characterCode)
        ) {
            for (let index = column; index < code.length; index++) {
                characterCode = code.charCodeAt(index);

                if (
                    ! this.characterIsAlphaNumeric(characterCode)
                    && characterCode !== 95
                ) {
                    break;
                }

                endColumn++;
            }

            for (let index = column; index > 0; index--) {
                characterCode = code.charCodeAt(index - 2);

                if (
                    ! this.characterIsAlphaNumeric(characterCode)
                    && ! this.characterIsSymbol(characterCode)
                ) {
                    break;
                }

                column--;
            }
        }

        return new Range(column, endColumn);
    }

    outputIsJson(output)
    {
        try {
            return (JSON.parse(output) && !!output);
        } catch (error) {
            return false;
        }
    }

    characterIsWhitespace(characterCode)
    {
        return characterCode === 32
            || (characterCode >= 9 && characterCode <= 13)
            || characterCode === 133
            || characterCode === 160;
    }

    characterIsAlphaNumeric(characterCode)
    {
        return (characterCode >= 48 && characterCode <= 57)
            || (characterCode >= 65 && characterCode <= 90)
            || (characterCode >= 97 && characterCode <= 122);
    }

    characterIsSymbol(characterCode)
    {
        return (characterCode >= 33 && characterCode <= 47)
            || (characterCode >= 58 && characterCode <= 64)
            || (characterCode >= 91 && characterCode <= 96)
            || (characterCode >= 123 && characterCode <= 126);
    }

    showInstalledStandards()
    {
        let process = new Process("/usr/bin/env", {
            args: [this.getExecutablePath(), "--version"],
            shell: true,
        });
        process.onStdout(function (line) {
            if (line.trim().length > 0) {
                console.log(line.trim());
            }
        });
        process.start();

        process = new Process("/usr/bin/env", {
            args: [this.getExecutablePath(), "-i"],
            shell: true,
        });
        process.onStdout(function (line) {
            if (line.trim().length > 0) {
                console.log(line.trim());
            }
        });
        process.start();
    }
}

nova.assistants.registerIssueAssistant("php", new IssuesProvider());

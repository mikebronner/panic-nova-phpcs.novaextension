exports.activate = function() {
    console.log("PHPCS: extension activated.");
    var process2 = new Process("/usr/bin/env", {
        args: ["chmod", "+x", "Bin/phpcs"],
        shell: true
    });
    process2.onStderr(function(line) {console.error(line);});
    process2.start();
}

exports.deactivate = function() {
    // Clean up state before the extension is deactivated
    console.log("Extension is being deactivated.");
}

class IssuesProvider {
    constructor() {
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

        return (((projectStandard || customStandard) || globalStandard) || defaultStandard);
    }
    
    provideIssues(editor) {
        let issues = [];
        let self = this;

        return new Promise(function (resolve) {
            try {
                const linter = new Process('/usr/bin/env', {
                    args: [
                        './Bin/phpcs',
                        '--report=json',
                        '--standard=' + self.getStandard(),
                        editor.document.path,
                    ],
                    shell: true,
                });
                
                linter.onStderr(function (error) {
                    console.error(error);
                });
                
                linter.onStdout(function (line) {
                    console.log("PHPCS Output: " + line);
                    resolve(self.parseLinterOutput(editor, line));
                });

                linter.onDidExit(function () {
                    console.log(
                        "PHPCS finished linting "
                        + editor.document.path
                    );
                });

                console.log(
                    "PHPCS started linting "
                    + editor.document.path
                );

                linter.start();
            } catch (error) {
                console.error(error);
            }
        });
    }
    
    parseLinterOutput(editor, output) {
        let lints = JSON.parse(output);
        let issues = Object
            .entries(lints.files)
            .flatMap(function ([path, lint]) {
                return lint.messages;
            })
            .map(function (lint) {
                let issue = new Issue();
    
                issue.message = lint.message;
                issue.severity = IssueSeverity.Warning;
                
                if (lint.type === "ERROR") {
                    issue.severity = IssueSeverity.Error;
                }
                
                issue.line = lint.line;
                issue.column = lint.column;
    
                return issue;
            });
            
        return issues;
    }
}

nova.assistants.registerIssueAssistant("php", new IssuesProvider());

exports.activate = function() {
    // update phpcs binary using phive
    console.log("PHPCS: extension activated.");

//     console.log("PHPCS update started.");
//     
//     var process = new Process("/usr/bin/env", {
//         args: ["Bin/phive", "install", "phpcs", "--target", "Bin", "--copy", "--trust-gpg-keys", "31C7E470E2138192"],
//         shell: true
//     });
//     
//     process.onStdout(function(line) {
//         line = line.replace("\n", "");
//         
//         if (line.length == 0) {
//             return;
//         }
//         
//         console.log("PHPCS: " + line);
//     });
// 
//     process.onStderr(function(line) {
//         console.error("PHPCS Error: " + line);
//     });
//     
//     process.start();
//     
//     process.onDidExit(function () {
//         console.log("PHPCS update finished.");
//     });
}

exports.deactivate = function() {
    // Clean up state before the extension is deactivated
    console.log("PHPCS: extension deactivated.");
}

class IssuesProvider {
    constructor() {
        const selectedStandard = nova.workspace.config.get(
            'genealabs.phpcs.standard',
            'string'
        );
        
        const globalStandard = nova.config.get(
            'com.thorlaksson.phpcs.standard',
            'string'
        );
    }
    
    provideIssues(editor) {
        let issues = [];
        let self = this;

        return new Promise(function (resolve) {
            try {
                const linter = new Process('/usr/bin/env', {
                    args: [
                        'Bin/phpcs',
                        '--report=json',
                        '--standard=PSR12', //+ environment.getPhpcsStandard(),
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

# Changelog
## [Upcoming]

## [Known Issues]
- Keeping an eye on how the linter behaves when it errors.

## [0.1.21] - 2021-04-07
### Added
- configurable executable path back in.
- PHPCS version to debug output.
- PHPCS installed standards to debug output.

### Fixed
- conjoining of multiple files being linted at the same time, which caused errors.

## [0.1.20] - 2021-04-06
### Updated
- output processing to not cause all issue matching extension to fail if PHPCS
  encountered an error.

## [0.1.19] - 2021-04-06
### Fixed
- output processing to not cause all issue matching extension to fail if PHPCS
  encountered an error.

## [0.1.18] - 2021-04-04
### Fixed
- false linting errors due to "non-quiet" linter output. Reduced the verbosity
  to only provide JSON output.

## [0.1.17] - 2021-04-04
### Fixed
- handling of linter error output to not falsely trigger if the work error is
  randomly contained in the linter output.

## [0.1.16] - 2021-04-04
### Added
- catching of errors thrown by the linter. These would previously wreck the
  extension, and are now output to Nova's Extension Console.

## [0.1.15] - 2021-04-04
### Fixed
- issue with multiple processes trying to start up.

## [0.1.14] - 2021-04-04
### Added
- license details.

### Updated
- linting process to use `stdin` instead of relying on a file, which greatly
  improves performance.

## [0.1.10 to 0.1.13] - 2021-04-03
### Fixed
- license reference.

## [0.1.10] - 2021-04-03
### Added
- linter process cancelation, for the event that a new linter was started before
  the previous one finished.
- temporary file storage to lint in-buffer documents.
- configuration option to show debug logs (and conversely hide debug logs if not
  enabled).
- improved logging with more details.

## [0.1.9] - 2021-04-03
### Added
- Upcoming and Known Issues details.

## [0.1.8] - 2021-04-03
### Fixed
- implementation of additional linting information.

## [0.1.7] - 2021-04-03
### Added
- additional linting information in the message.

### Fixed
- linting hints to underling the affected word, not just the first character.

## [0.1.6] - 2021-03-31
### Removed
- elaborate extension activation processes to avoid issues for now.

## [0.1.5] - 2021-03-28
### Fixed
- self-updating of Phive binary.

## [0.1.4] - 2021-03-28
### Added
- process to update PHIVE binary.
- GPG2 binary for Phive.

## [0.1.3] - 2021-03-28
### Added
- process to set PHIVE binary chmod flags.

## [0.1.2] - 2021-03-28
### Added
- process to set PHPCS binary chmod flags.

## [0.1.1] - 2021-03-28
### Added
- PHPCS standard configuration functionality.
- PHPCS binary update when extension is loaded.

## [0.1.0] - 2021-03-28
### Added
- initial functionality.

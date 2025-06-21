Entabulate
==========

Convert Json files to CSV.

Supported inputs are: [Json Lines](https://jsonlines.org/) (aka. ND Json), regular Json files containing a top-level array, and folders of Json files.

Data is streamed, so inputs that are larger than your available memory can be converted. Array fields in the input are retained as Json in CSV output.

Outputs can be CSV or Json Lines.

Completions for Zsh will also be installed if a directory exists:

    $ mkdir -p /usr/local/share/zsh/site-functions
    $ chown -R $(whoami) /usr/local/share/zsh/site-functions


Installing
----------

    $ npm install -g entabulate

Alternatively, don't install it and just prepend the command with `npx`.

Usage
-----

Entabulate figures out what to do based on file extensions by default. You can override this behaviour by specifying an input or output format with `-i` and `-o`. If output isn't specified it will default to CSV and `stdout`.

### From Json Lines

Convert to CSV:

    $ entabulate in.jsonl out.csv

### From Json

If the input has a top-level array, it will be split so the output has multiple rows. If not, the output will just have one row.

Convert to CSV:

    $ entabulate in.json out.csv

Convert to Json Lines:

    $ entabulate in.json out.jsonl

### From CSV

Convert to Json Lines:

    $ entabulate in.csv out.jsonl

### From a folder of Json files

Folders with sub-folders are supported.

Convert to CSV:

    $ entabulate in-folder out.csv

Convert to Json Lines:

    $ entabulate in-folder out.jsonl

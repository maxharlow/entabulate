Entabulate
==========

Convert Json files to CSV.

Supported inputs are: [Json Lines](https://jsonlines.org/) (aka. ND Json), regular Json files containing a top-level array, and folders of Json files.

Data is streamed, so inputs that are larger than your available memory can be converted. Array fields in the input are retained as Json in CSV output.

Outputs can be CSV or Json Lines.


Installing
----------

    $ npm install -g entabulate

Alternatively, don't install it and just prepend the command with `npx`.

Usage
-----

Entabulate figures out what to do based on file extensions by default. If output isn't specified it will default to CSV and `stdout`.

Convert a Json Lines file to CSV:

    $ entabulate in.jsonl out.csv

Convert a Json file containing a top-level array to CSV:

    $ entabulate in.json out.csv

Convert a Json file containing a top-level array to Json Lines:

    $ entabulate in.json out.jsonl

Convert a folder of Json files to a single Json Lines file:

    $ entabulate in-folder out.jsonl

Convert a folder of Json files to a CSV file:

    $ entabulate in-folder out.csv

You can override this behaviour by specifying an input or output format with `-i` and `-o`.

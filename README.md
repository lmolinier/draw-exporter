# draw-exporter

This project aims at providing a convenient CLI from exporting draw.io diagrams, given the sheet name and/or layers. Basically is relies on the export functionnality provided by drawio, but with a simple CLI.

## Architecture

The `draw-exporter` can parse the XML format from drawio in order to extract some basic information, such as pages and layers names. This is more usefull than providing an index number. To make the export, it spawns an electron app running the standard drawio application that performs the export.

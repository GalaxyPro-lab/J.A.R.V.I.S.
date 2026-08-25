When reading or writing files in the workspace:
1. Always inspect existing files using `read_file` or `list_directory` before making changes.
2. Use `write_file` for new files and `edit_file` for targeted surgical modifications.
3. For file deletion or terminal execution, be explicit about the reason.

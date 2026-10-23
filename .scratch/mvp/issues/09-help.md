# Help

Status: ready-for-agent
Type: task
Blocked by: 08

## What

Command discovery: the hint under the chat input, `/help` | `/ajuda`, and the autocomplete on `/`.

See [spec](../spec.md): Help.

## Acceptance criteria

- [ ] The hint lists the commands in the UI language.
- [ ] `/help` | `/ajuda` replies with a notice listing the commands in the asker's language.
- [ ] Typing `/` shows the command names in the UI language; a prefix matching a name in another language shows that one too.

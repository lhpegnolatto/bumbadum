# Triage Labels

The skills speak in terms of five canonical triage roles. In this repo's local tracker a role is written as the ticket's `Status:` line, e.g. `Status: ready-for-agent`.

| Label in mattpocock/skills | `Status:` value   | Meaning                                  |
| -------------------------- | ----------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`    | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`      | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent` | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human` | Requires human implementation            |
| `wontfix`                  | `wontfix`         | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding value from this table.

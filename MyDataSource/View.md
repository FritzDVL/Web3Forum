Let me make sure I understand by mapping it out. The Research section should use the same table layout as Boards:

| Column     | Width | Header       | Content                                                                                                          |
| ---------- | ----- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| Topic      | 58%   | "Topic"      | Line 1: Title (clickable link). Line 2: Small category badge [Category Name] + tag badge [Tag Name] side by side |
| Started by | 12%   | "Started by" | Small circle avatar + Lens username next to it                                                                   |
| Replies    | 10%   | "Replies"    | Count                                                                                                            |
| Views      | 10%   | "Views"      | Count                                                                                                            |
| Activity   | 10%   | "Activity"   | Compact relative time ("2h", "3d")                                                                               |

Same styling: row dividers, darker header divider, vertical lines between header columns (floating, not touching bottom border).

A few clarifications:

- For "Started by" — in Boards we show just the text name. Here you want the small avatar circle back alongside the name. Should I also
  update Boards to match this, or keep Boards as text-only and Research gets avatar + name?
- The category and tag badges — are these the pill/rounded style like the board category tag, or more like square brackets literally
  [DeFi] [governance]?
- Does Research currently have repliesCount, viewsCount, and a lastActivityAt equivalent? I'll need to check the data model to confirm
  what's available.

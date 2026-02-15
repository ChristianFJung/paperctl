import type { Command } from "commander";
import { addTopic, listTopics, removeTopic } from "../lib/db.ts";
import { bold, cyan, dim, formatDate, output, success, warn } from "../lib/output.ts";

export function registerTrackCommand(program: Command): void {
  program
    .command("track")
    .description("Add a topic to watch")
    .argument("<topic>", "Topic string to track")
    .action((topic: string, _opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals();
      const { created, topic: t } = addTopic(topic.trim());

      if (globalOpts.json) {
        output({ ok: true, topic: t.name, action: created ? "added" : "exists" });
      } else if (created) {
        success(`Now tracking: ${bold(t.name)}`);
      } else {
        warn(`Already tracking: ${t.name}`);
      }
    });

  program
    .command("untrack")
    .description("Remove a tracked topic")
    .argument("<topic>", "Topic string to remove")
    .action((topic: string, _opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals();
      const removed = removeTopic(topic.trim());

      if (globalOpts.json) {
        output({ ok: true, topic: topic.trim(), action: removed ? "removed" : "not_found" });
      } else if (removed) {
        success(`Stopped tracking: ${bold(topic.trim())}`);
      } else {
        warn(`Topic not found: ${topic.trim()}`);
      }
    });

  program
    .command("topics")
    .description("List tracked topics")
    .action((_opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals();
      const topics = listTopics();

      if (globalOpts.json) {
        output(topics);
        return;
      }

      if (topics.length === 0) {
        output("No topics tracked yet. Use `paperctl track <topic>` to add one.");
        return;
      }

      output(bold("Tracked Topics:\n"));
      topics.forEach((t, i) => {
        output(
          `  ${dim(`${i + 1}.`)} ${cyan(t.name)} ${dim(`(since ${formatDate(t.created_at)})`)}`,
        );
      });
    });
}

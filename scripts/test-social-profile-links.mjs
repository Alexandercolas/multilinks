import assert from "node:assert/strict";
import { isSocialProfileLink } from "../lib/platforms.ts";

for (const url of [
  "https://instagram.com/example",
  "https://facebook.com/example",
  "https://x.com/example",
  "https://linkedin.com/in/example",
  "https://threads.com/@example",
  "https://tiktok.com/@example",
  "https://youtube.com/@example",
  "https://youtube.com/channel/UCexample/videos",
  "https://twitch.tv/example",
  "https://pinterest.com/example/",
  "https://discord.gg/example",
  "https://t.me/example",
  "https://wa.me/18095551234",
]) {
  assert.equal(isSocialProfileLink({ url, linkType: "standard" }), true, url);
}
for (const url of [
  "https://example.com/project",
  "https://instagram.com.evil.example/profile",
  "https://tiktok.com/@example/video/123",
  "https://youtube.com/watch?v=example",
  "https://youtube.com/shorts/example",
  "https://youtu.be/example",
  "https://music.youtube.com/watch?v=example",
  "https://twitch.tv/videos/123",
  "https://clips.twitch.tv/example",
  "https://pinterest.com/pin/123",
  "https://open.spotify.com/playlist/example",
  "invalid-url",
]) {
  assert.equal(isSocialProfileLink({ url }), false, url);
}
assert.equal(
  isSocialProfileLink({ url: "https://example.com", linkType: "social" }),
  true,
);
console.log(
  "Social profile detection passed: legacy networks, explicit social links and media exclusions.",
);

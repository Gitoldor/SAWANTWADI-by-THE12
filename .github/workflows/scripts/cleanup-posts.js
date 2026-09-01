const fs = require("fs");

const file = "posts.json";
const posts = JSON.parse(fs.readFileSync(file, "utf8"));

const now = Date.now();

const remaining = posts.filter(post => {
  if (!post.endTime) return true;

  return new Date(post.endTime).getTime() > now;
});

fs.writeFileSync(
  file,
  JSON.stringify(remaining, null, 2) + "\n"
);

console.log(`Deleted ${posts.length - remaining.length} expired posts.`);

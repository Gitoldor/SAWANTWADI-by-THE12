const fs = require("fs");

const file = "posts.js";
const code = fs.readFileSync(file, "utf8");

const start = code.indexOf("[");
const end = code.lastIndexOf("]");

if (start === -1 || end === -1) {
  throw new Error("Posts array not found");
}

const posts = eval(code.slice(start, end + 1));

const now = Date.now();

const remaining = posts.filter(post => {
  if (!post.endTime) return true;

  return new Date(post.endTime).getTime() > now;
});

const output =
  "window.Sho1re1Places = " +
  JSON.stringify(remaining, null, 2) +
  ";\n";

fs.writeFileSync(file, output);

console.log(
  `Removed ${posts.length - remaining.length} expired posts.`
);

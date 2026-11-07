const extractHashtags = (caption) => {
  if (!caption) return [];
  const matches = caption.match(/#(\w+)/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
};

module.exports = { extractHashtags };


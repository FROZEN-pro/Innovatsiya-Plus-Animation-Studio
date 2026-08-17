const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const collectionGroupRules = `
    match /{path=**}/likes/{videoId} {
      allow read: if isAdmin();
    }
    match /{path=**}/watchHistory/{videoId} {
      allow read: if isAdmin();
    }
`;

rules = rules.replace(
  '  }\n}',
  collectionGroupRules + '  }\n}'
);
fs.writeFileSync('firestore.rules', rules);

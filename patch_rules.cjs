const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const commentRules = `
    // Validation Blueprint for Comment
    function isValidComment(data) {
      return data.keys().hasAll(['videoId', 'userId', 'text', 'createdAt'])
        && data.videoId is string && data.videoId.size() <= 128
        && data.userId is string && data.userId == request.auth.uid
        && (!('userDisplayName' in data) || (data.userDisplayName is string && data.userDisplayName.size() <= 100))
        && (!('userPhotoURL' in data) || (data.userPhotoURL is string && data.userPhotoURL.size() <= 500))
        && data.text is string && data.text.size() > 0 && data.text.size() <= 1000
        && data.createdAt == request.time;
    }

    match /comments/{commentId} {
      allow read: if request.auth != null;
      allow create: if isSignedIn() && isValidComment(incoming());
      allow update: if false; 
      allow delete: if isAdmin() || (isSignedIn() && existing().userId == request.auth.uid);
    }
`;

rules = rules.replace(
  '  }\n}',
  commentRules + '  }\n}'
);

fs.writeFileSync('firestore.rules', rules);

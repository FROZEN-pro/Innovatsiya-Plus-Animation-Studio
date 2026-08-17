const fs = require('fs');

// Blueprint
let bp = JSON.parse(fs.readFileSync('firebase-blueprint.json', 'utf8'));

bp.entities.UserLike = {
  "title": "UserLike",
  "description": "User like for a video",
  "type": "object",
  "properties": {
    "videoId": { "type": "string", "maxLength": 128 },
    "createdAt": { "type": "number" }
  },
  "required": ["videoId", "createdAt"]
};

bp.entities.VideoStats = {
  "title": "VideoStats",
  "description": "Video statistics like total likes",
  "type": "object",
  "properties": {
    "likes": { "type": "number" }
  },
  "required": ["likes"]
};

bp.firestore["users/{userId}/likes/{videoId}"] = {
  "schema": { "$ref": "#/entities/UserLike" },
  "description": "Likes from a specific user"
};

bp.firestore["videoStats/{videoId}"] = {
  "schema": { "$ref": "#/entities/VideoStats" },
  "description": "Public video statistics"
};

fs.writeFileSync('firebase-blueprint.json', JSON.stringify(bp, null, 2));

// Rules
let rules = fs.readFileSync('firestore.rules', 'utf8');

const likeRules = `
    // Validation Blueprint for UserLike
    function isValidUserLike(data) {
      return data.keys().hasAll(['videoId', 'createdAt'])
        && data.videoId is string && data.videoId.size() <= 128
        && data.createdAt is number;
    }
    
    // Validation Blueprint for VideoStats
    function isValidVideoStats(data) {
      return data.keys().hasAll(['likes'])
        && data.likes is number;
    }

    match /videoStats/{videoId} {
      allow read: if true;
      allow create: if isSignedIn() && isValidVideoStats(incoming());
      allow update: if isSignedIn() && isValidVideoStats(incoming()) && incoming().diff(existing()).affectedKeys().hasOnly(['likes']);
      allow delete: if isAdmin();
    }
`;

rules = rules.replace(
  'match /users/{userId} {',
  'match /users/{userId} {\n' +
  '      match /likes/{videoId} {\n' +
  '        allow read: if request.auth != null && (request.auth.uid == userId || isAdmin());\n' +
  '        allow create: if isSignedIn() && request.auth.uid == userId && isValidUserLike(incoming());\n' +
  '        allow delete: if isSignedIn() && request.auth.uid == userId;\n' +
  '      }\n'
);

rules = rules.replace(
  '  }\n}',
  likeRules + '  }\n}'
);

fs.writeFileSync('firestore.rules', rules);

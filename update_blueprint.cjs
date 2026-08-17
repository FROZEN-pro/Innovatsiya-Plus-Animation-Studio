const fs = require('fs');
const bp = JSON.parse(fs.readFileSync('firebase-blueprint.json', 'utf8'));

bp.entities.Comment = {
  "title": "Comment",
  "description": "User comment on a video",
  "type": "object",
  "properties": {
    "videoId": { "type": "string", "maxLength": 128 },
    "userId": { "type": "string", "maxLength": 128 },
    "userDisplayName": { "type": "string", "maxLength": 100 },
    "userPhotoURL": { "type": "string", "maxLength": 500 },
    "text": { "type": "string", "maxLength": 1000 },
    "createdAt": { "type": "number" }
  },
  "required": ["videoId", "userId", "text", "createdAt"]
};

bp.firestore["comments/{commentId}"] = {
  "schema": { "$ref": "#/entities/Comment" },
  "description": "Video comments"
};

fs.writeFileSync('firebase-blueprint.json', JSON.stringify(bp, null, 2));

const fs = require('fs');
let data = fs.readFileSync('src/pages/VideoPlayer.tsx', 'utf8');

data = data.replace(
  "import { db, auth } from '../lib/firebase';",
  "import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';"
);

data = data.replace(
  "    const unsubscribe = onSnapshot(q, (snapshot) => {",
  "    const pathForOnSnapshot = 'comments';\n    const unsubscribe = onSnapshot(q, (snapshot) => {"
);

data = data.replace(
  "    }, (error) => {\n      console.error(\"Error fetching comments:\", error);\n    });",
  "    }, (error) => {\n      handleFirestoreError(error, OperationType.LIST, pathForOnSnapshot);\n    });"
);

data = data.replace(
  "    } catch (err) {\n      console.error(\"Error posting comment:\", err);\n      alert(\"Failed to post comment.\");",
  "    } catch (error) {\n      handleFirestoreError(error, OperationType.CREATE, 'comments');"
);

data = data.replace(
  "    } catch (err) {\n      console.error(\"Error deleting comment:\", err);\n      alert(\"Failed to delete comment.\");",
  "    } catch (error) {\n      handleFirestoreError(error, OperationType.DELETE, `comments/${commentId}`);"
);

fs.writeFileSync('src/pages/VideoPlayer.tsx', data);

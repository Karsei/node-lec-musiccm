var express = require('express');
var fs = require('fs');
var multer = require('multer');
var router = express.Router();

var uploadSetting = multer({ dest: "/home/karsei/musiccm/public_html/uploads" });

/* POST upload - ckeditor */
router.post('/upload', uploadSetting.single('upload'), function(req, res) {
     try {
          var tmpPath = req.file.path;
          var fileName = req.file.filename;

          var fileExtLastdot = req.file.originalname.lastIndexOf('.');
          var fileExt = req.file.originalname.substring(fileExtLastdot, req.file.originalname.length);

          var newPath = "/home/karsei/musiccm/public_html/public/images/" + fileName + fileExt;

          console.log(req.file);
          console.log("File (tmpPath): " + tmpPath);
          console.log("FileName (fileName): " + fileName);
          console.log("FileExt (Ext): " + fileExt);

          fs.rename(tmpPath, newPath, function (err) {
               if (err) {
                    console.error(err);
               }

               var html;

               html = "";
               html += "<script type='text/javascript'>";
               html += "var funcNum = " + req.query.CKEditorFuncNum + ";";
               html += "var url = \"/images/" + fileName + fileExt + "\";";
               html += "var message = \"업로드 완료\";";
               html += "window.parent.CKEDITOR.tools.callFunction(funcNum, url);";
               html += "</script>";

               res.send(html);
          });
     } catch (e) {
          console.error(e);
     }
});

module.exports = router;

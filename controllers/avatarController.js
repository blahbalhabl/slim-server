const fs = require('fs');
const UserModel = require('../models/userModel');

const avatarUpload = async (req, res) => {
  const userId = req.id;

  if(!req.file) {
    return res.status(400).json({err: 'No file found!'})
  }

  try {
    const photo = req.file.filename;
    const user = await UserModel.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Update the avatar property of the user document
    user.avatar = photo;
    await user.save(); // Save the updated user document

    res.status(200).json({ message: 'Avatar updated successfully' });
  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// Debugging function, Remove later.
const getAvatars = async (req, res) => {
  const userId = req.id;
  try {
    const avatars = await UserModel.findById(userId)

    res.status(200).send(avatars);
  } catch (error) {
    console.error('Error getting avatars:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

const delAvatar = async (req, res) => {
  try {
    const fileName = req.params.fileName;

    //  Delete the file from server
    const filePath = `../server/uploads/images/${fileName}`;
    await fs.promises.unlink(filePath);

    return res.status(200).json({message: 'Avatar File Deleted'});
  } catch(err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ message: 'Avatar not found' });
    }
    res.status(500).json({err, message: 'Internal Server Error!'});
  }
};

const uploadLogo = async (req, res) => {
  try {
    const fileName = req.params.file;
    const newFile = req.body.file;

    if(!req.file) {
      return res.status(400).json({err: 'No file found!'})
    }

    //  Delete the file from server
    const filePath = `../server/uploads/images/${fileName}`;
    await fs.promises.unlink(filePath);

    res.status(200).json({file: newFile, message: 'Successfully Updated Logo!'});

  } catch (err) {
    res.status(500).json({err, message: 'Internal Server Error'});
  }
}

module.exports = {
  avatarUpload,
  getAvatars,
  delAvatar,
  uploadLogo,
}

export const uploadFile = async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }
      res.status(201).json({ success: true, data: req.file });
    } catch (error) {
      next(error);
    }
  };
  
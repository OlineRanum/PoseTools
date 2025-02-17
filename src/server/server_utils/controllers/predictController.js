// server_utils/controllers/predictController.js
const { spawn } = require('child_process');
const path = require('path');

exports.predictHandshapes = (req, res) => {
  const { model, dataType, files, visualize } = req.body;
  if (!model || !dataType || !files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid parameters.' });
  }
  
  const filesArg = files.join(',');
  // Updated scriptPath to the new location
  const scriptPath = path.resolve(__dirname, '../../../modules/data/mocap_data/prediction/process_prediction.py');
  const args = [
    scriptPath,
    model,               // will be "ED Model"
    dataType,
    filesArg,
    visualize ? 'true' : 'false'
  ];
  
  console.log('Spawning prediction Python script with args:', args);
  
  const pythonProcess = spawn('python3', args);
  let pythonOutput = '';
  pythonProcess.stdout.on('data', (data) => {
    pythonOutput += data.toString();
  });
  
  let pythonError = '';
  pythonProcess.stderr.on('data', (data) => {
    pythonError += data.toString();
  });
  
  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('Python prediction script exited with error code:', code, pythonError);
      return res.status(500).json({ error: `Python script error (code ${code}): ${pythonError}` });
    }
    
    try {
      const parsed = JSON.parse(pythonOutput);
      res.json({
        success: true,
        message: 'Prediction completed via Python script.',
        data: parsed
      });
    } catch (err) {
      console.error('Failed to parse Python output as JSON:', err, pythonOutput);
      res.status(500).json({ error: 'Invalid JSON output from Python.' });
    }
  });
};

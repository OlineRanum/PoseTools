export function initReferencePoseHSViewer() {
    // -------- Reference Poses Viewer Elements --------
    const poseSelectContainer    = document.getElementById('pose-select-container');
    const referenceImageContainer= document.getElementById('reference-poses-container');
    const poseLoading            = document.getElementById('pose-loading');
    const clearAllBtn            = document.getElementById('clear-all-btn');
    // Reference Poses / sb_references
    let referencePoses     = [];
    let sbReferenceFiles   = [];
    fetchReferencePoses(); 
    fetchSbReferences();  
    
    function fetchReferencePoses() {
        fetch('/api/graphics/reference_poses', { cache: 'no-store' })
            .then(response => response.json())
            .then(pngFiles => {
                if (pngFiles.length === 0) {
                    poseSelectContainer.innerHTML = '<p>No Reference Poses available</p>';
                    return;
                }
                referencePoses = pngFiles;
                pngFiles.forEach(png => {
                    const checkbox = document.createElement('input');
                    checkbox.type  = 'checkbox';
                    checkbox.id    = `pose-${png}`;
                    checkbox.value = png;
                    checkbox.setAttribute('aria-label', `Select ${png} Pose`);

                    const label = document.createElement('label');
                    label.htmlFor = `pose-${png}`;
                    label.textContent = png;

                    // Thumbnail
                    const thumbnail = document.createElement('img');
                    thumbnail.src   = `/graphics/reference_poses/${png}`;
                    thumbnail.alt   = `${png} thumbnail`;
                    thumbnail.style.width = '50px';
                    thumbnail.style.height= 'auto';
                    thumbnail.style.marginRight = '10px';
                    thumbnail.style.border = '1px solid #ccc';
                    thumbnail.style.objectFit = 'cover';
                    thumbnail.style.flexShrink = '0';

                    const container = document.createElement('div');
                    container.style.display = 'flex';
                    container.style.alignItems = 'center';
                    container.style.marginBottom = '10px';

                    checkbox.style.marginRight = '10px';

                    container.appendChild(checkbox);
                    container.appendChild(thumbnail);
                    container.appendChild(label);
                    poseSelectContainer.appendChild(container);

                    checkbox.addEventListener('change', (ev) => {
                        if (ev.target.checked) {
                            displayReferencePose(png);
                        } else {
                            removeReferencePose(png);
                        }
                        updateClearAllButtonState();
                    });
                });
            })
            .catch(error => {
                console.error('Error fetching Reference Poses:', error);
                poseSelectContainer.innerHTML = '<p>Error loading Reference Poses</p>';
            });
    }

    function fetchSbReferences() {
        fetch('/api/graphics/sb_references', { cache: 'no-store' })
            .then(response => response.json())
            .then(jpgFiles => {
                sbReferenceFiles = jpgFiles;
            })
            .catch(error => {
                console.error('Error fetching sb_references:', error);
            });
    }

    function displayReferencePose(png) {
        if (document.getElementById(`pose-wrapper-${png}`)) {
            return; // already displayed
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'reference-image-wrapper';
        wrapper.id        = `pose-wrapper-${png}`;

        const baseName        = png.replace(/^final_/, '').replace(/\.png$/i, '');
        const sbReferenceName = `${baseName}.jpg`;
        const sbRefExists     = sbReferenceFiles.includes(sbReferenceName);

        // Pose caption + image
        const poseCaption = document.createElement('div');
        poseCaption.className= 'caption';
        poseCaption.textContent= png;

        const poseImg   = document.createElement('img');
        poseImg.src     = `/graphics/reference_poses/${png}`;
        poseImg.alt     = png;
        poseImg.onload  = () => { /* loaded */ };
        poseImg.onerror = () => {
            console.error(`Failed to load Reference Pose: ${png}`);
            poseImg.alt = 'Failed to load image.';
        };

        wrapper.appendChild(poseCaption);
        wrapper.appendChild(poseImg);

        // If sb_reference exists
        if (sbRefExists) {
            const sbCaption  = document.createElement('div');
            sbCaption.className= 'caption';
            sbCaption.textContent= sbReferenceName;

            const sbImg   = document.createElement('img');
            sbImg.src     = `/graphics/sb_references/${sbReferenceName}`;
            sbImg.alt     = sbReferenceName;
            sbImg.onload  = () => { /* loaded */ };
            sbImg.onerror = () => {
                console.error(`Failed to load sb_reference Image: ${sbReferenceName}`);
                sbImg.alt = 'Failed to load image.';
            };

            wrapper.appendChild(sbCaption);
            wrapper.appendChild(sbImg);
        } else {
            const noSbRef = document.createElement('div');
            noSbRef.className= 'caption';
            noSbRef.textContent= 'No corresponding sb_reference found.';
            wrapper.appendChild(noSbRef);
        }
        referenceImageContainer.appendChild(wrapper);
    }

    function removeReferencePose(png) {
        const wrapper = document.getElementById(`pose-wrapper-${png}`);
        if (wrapper) wrapper.remove();
    }

    function clearAllSelectedPoses() {
        const checkedCheckboxes = poseSelectContainer.querySelectorAll('input[type="checkbox"]:checked');
        checkedCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
            removeReferencePose(checkbox.value);
        });
        updateClearAllButtonState();
    }
    function updateClearAllButtonState() {
        const anyChecked = (poseSelectContainer.querySelectorAll('input[type="checkbox"]:checked').length > 0);
        clearAllBtn.disabled = !anyChecked;
    }
    clearAllBtn.addEventListener('click', clearAllSelectedPoses);
    updateClearAllButtonState();


}

export function initClusterSubTab() {
    const dataTypeRadios       = document.querySelectorAll('input[name="dataType"]');
    const dataFilesContainer   = document.getElementById('data-files-container');
    const usePrecroppedCheckbox= document.getElementById('use-precropped');
    const clusterKInput        = document.getElementById('cluster-k-input');
    const processButton        = document.getElementById('cluster-process-btn');
    const useVisualizeCheckbox             = document.getElementById('visualize-checkbox'); 


    // Step 1: Handle dataType selection
    dataTypeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const selectedType = radio.value; // "mocap" or "video"
        // Fetch list of files for that data type
        fetchDataFiles(selectedType);
      });
    });

    function fetchDataFiles(dataType) {
        console.log('Fetching data files for:', dataType);
        // The path depends on your existing server route:
        // GET /api/data/mocap or GET /api/data/video
        fetch(`/api/data/${dataType}`)
          .then(response => response.json())
          .then(files => {
            // 1) Clear any existing file list
            dataFilesContainer.innerHTML = '';
    
            // 2) If no files found, show a message
            if (!files || files.length === 0) {
              dataFilesContainer.innerHTML = '<p>No files found.</p>';
              return;
            }
    
            // 3) Create a checkbox + label for each file
            files.forEach(fileName => {
              const checkbox = document.createElement('input');
              checkbox.type  = 'checkbox';
              checkbox.value = fileName;
              checkbox.id    = `file-${fileName}`;
    
              const label    = document.createElement('label');
              label.htmlFor  = checkbox.id;
              label.textContent = fileName;
    
              // Wrap them in a container or just do line-breaks
              const wrapper  = document.createElement('div');
              wrapper.appendChild(checkbox);
              wrapper.appendChild(label);
    
              dataFilesContainer.appendChild(wrapper);
            });
          })
          .catch(err => {
            console.error('Error fetching data files:', err);
            dataFilesContainer.innerHTML = '<p style="color:red;">Error loading files.</p>';
          });
      }

    // Step 2: Handle "Process" button
    processButton.addEventListener('click', () => {
      // Collect the user inputs
      const selectedDataType = Array.from(dataTypeRadios).find(r => r.checked)?.value;
      const usePrecropped    = usePrecroppedCheckbox.checked;
      const kValue           = parseInt(clusterKInput.value, 10) || 1;
      const useVisualize        = useVisualizeCheckbox.checked;
      console.log('Visualize checkbox value:', useVisualize);
  
      // Collect all checked files
      const checkedBoxes  = dataFilesContainer.querySelectorAll('input[type="checkbox"]:checked');
      const selectedFiles = Array.from(checkedBoxes).map(box => box.value);
  
      // Basic validation
      if (!selectedDataType) {
        alert('Please select a data type (Motion Capture or Video).');
        return;
      }
      if (selectedFiles.length === 0) {
        alert('Please select at least one file.');
        return;
      }
      if (kValue < 1) {
        alert('Number of clusters (k) must be >= 1.');
        return;
      }
  

    const bodyPayload = {
        dataType: selectedDataType, 
        files: selectedFiles,
        precropped: usePrecropped,
        k: kValue,
        visualize: useVisualize
    };

    
    fetch('/api/cluster/handshapes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
    })
        .then(resp => resp.json())
        .then(result => {
        console.log('Clustering result:', result);
        // Show a success message or process the result in the UI
        })
        .catch(err => {
        console.error('Error calling cluster API:', err);
        });

        alert('Clustering completed! Check console or UI for results.');
    });
  }


// predict.js
export function initPredictSubTab() {
  // Get references to elements
  const modelSelect = document.getElementById('mocap-model-select');
  const dataTypeRadios = document.querySelectorAll('#predict-handshapes input[name="dataType"]');
  const dataFilesContainer = document.getElementById('data-files-container');
  const mocapFilesSelect = document.getElementById('mocap-files-select');
  const visualizeCheckbox = document.getElementById('visualize-checkbox-predict');
  const processButton = document.getElementById('predict-process-btn');
  const gifSelectPredict = document.getElementById('mocap-gif-select-predict'); // Get it once
  const gifImage = document.getElementById('mocap-gif-image');

  // (A) Populate Model Select with "ED Model"
  modelSelect.innerHTML = '';
  const modelOption = document.createElement('option');
  modelOption.value = 'ED Model';
  modelOption.textContent = 'ED Model';
  modelSelect.appendChild(modelOption);

  // (B) Handle data type selection and file fetching
  dataTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const selectedType = radio.value; // "mocap" or "video"
      fetchDataFiles(selectedType);
    });
  });

  function fetchDataFiles(dataType) {
    console.log('fetchDataFiles called with:', dataType);
    if (dataType === 'mocap') {
      dataFilesContainer.style.display = 'none';
      mocapFilesSelect.style.display = 'block';
      console.log("Showing mocap dropdown");
      // Populate dropdown
      fetch(`/api/data/${dataType}/corp`)
        .then(response => response.json())
        .then(gifs => {
          console.log("GIFs received:", gifs);
          // Clear and populate the dropdown with options
          mocapFilesSelect.innerHTML = '<option value="">--Select a GIF--</option>';
          gifs.forEach(gif => {
            const option = document.createElement('option');
            // If gif is an object, use its properties; if it's a string, use it directly
            if (typeof gif === 'object' && gif !== null) {
              option.value = gif.filename;
              option.textContent = gif.displayName;
            } else {
              option.value = gif;
              option.textContent = gif;
            }
            mocapFilesSelect.appendChild(option);
          });
          console.log("GIF dropdown populated.");
        })
        .catch(err => {
          console.error('Error fetching mocap files:', err);
          mocapFilesSelect.innerHTML = '<option style="color:red;">Error loading files.</option>';
        });
    } else {
      mocapFilesSelect.style.display = 'none';
      dataFilesContainer.style.display = 'block';
      console.log("Showing checkbox container for non-mocap files");
      // Populate checkboxes
      fetch(`/api/data/${dataType}`)
        .then(response => response.json())
        .then(files => {
          dataFilesContainer.innerHTML = '';
          files.forEach(fileName => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = fileName;
            checkbox.id = `file-${fileName}`;

            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = fileName;

            const wrapper = document.createElement('div');
            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
            dataFilesContainer.appendChild(wrapper);
          });
        })
        .catch(err => {
          console.error('Error fetching non-mocap files:', err);
          dataFilesContainer.innerHTML = '<p style="color:red;">Error loading files.</p>';
        });
    }
  }

  // (C) Handle the Predict button click
  processButton.addEventListener('click', () => {
    const selectedModel = modelSelect.value;
    const selectedDataType = Array.from(dataTypeRadios).find(r => r.checked)?.value;
    const useVisualize = visualizeCheckbox.checked;
    let selectedFiles = [];
    if (selectedDataType === 'mocap') {
      // Get selected options from the dropdown (can be multi-select)
      selectedFiles = Array.from(mocapFilesSelect.selectedOptions).map(opt => opt.value);
    } else {
      // Get selected files from checkboxes
      const checkedBoxes = dataFilesContainer.querySelectorAll('input[type="checkbox"]:checked');
      selectedFiles = Array.from(checkedBoxes).map(cb => cb.value);
    }

    // Basic validation
    if (!selectedModel) {
      alert('Please select a model.');
      return;
    }
    if (!selectedDataType) {
      alert('Please select a data type (Motion Capture or Video).');
      return;
    }
    if (selectedFiles.length === 0) {
      alert('Please select at least one file.');
      return;
    }

    const bodyPayload = {
      model: selectedModel, // will be "ED Model"
      dataType: selectedDataType,
      files: selectedFiles,
      precropped: false,
      visualize: useVisualize
    };

    console.log('Posting prediction payload:', bodyPayload);

    fetch('/api/predict/handshapes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload)
    })
      .then(resp => resp.json())
      .then(result => {
        console.log('Prediction result:', result);
        alert('Prediction completed! Check console for details.');
      })
      .catch(err => {
        console.error('Error calling prediction API:', err);
      });
  });

  // (D) Populate GIF Viewer with processed visualizations
  console.log("About to fetch GIFs from /api/graphics/mocap_gifs");
  fetch('/api/graphics/mocap_gifs')
    .then(res => res.json())
    .then(gifs => {
      console.log("GIFs received:", gifs);
      // Use gifSelectPredict from above (make sure the element exists)
      const gifSelectPredict = document.getElementById('mocap-gif-select-predict');
      if (!gifSelectPredict) {
        console.error("Element mocap-gif-select-predict not found");
        return;
      }
      gifSelectPredict.innerHTML = '<option value="">--Select a GIF--</option>';
      gifs.forEach(gif => {
        const option = document.createElement('option');
        if (typeof gif === 'object' && gif !== null) {
          option.value = gif.filename;
          option.textContent = gif.displayName;
        } else {
          option.value = gif;
          option.textContent = gif;
        }
        gifSelectPredict.appendChild(option);
      });
      console.log("GIF dropdown populated.");
      // Attach event listener
      gifSelectPredict.addEventListener('change', () => {
        const selectedGifUrl = gifSelectPredict.value;
        console.log("Selected GIF URL:", selectedGifUrl);
        gifImage.src = '/graphics/mocap_gifs/' + selectedGifUrl;
      });
    })
    .catch(err => console.error('Error fetching GIFs:', err));
}

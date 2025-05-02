document.addEventListener('DOMContentLoaded', function() {
    const calculateButton = document.getElementById('calculateButton');
    const calculatedCategorySpan = document.getElementById('calculatedCategory');
    const preTreatmentSizeInput = document.getElementById('preTreatmentSize');
    const postTreatmentSizeInput = document.getElementById('postTreatmentSize');
    const diffusionRestrictionSelect = document.getElementById('diffusionRestriction'); // Changed ID and variable name
    const t2HyperintensitySelect = document.getElementById('t2Hyperintensity'); // Changed ID and variable name
    const resultArea = document.getElementById('resultArea'); // To display errors

    calculateButton.addEventListener('click', function() {
        // Clear previous errors/results
        calculatedCategorySpan.textContent = '---';
        calculatedCategorySpan.style.color = 'inherit';
        const existingError = resultArea.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Get input values
        const preSizeStr = preTreatmentSizeInput.value;
        const postSizeStr = postTreatmentSizeInput.value;
        const diffusionRestrictionValue = diffusionRestrictionSelect.value; // Get value from select
        const t2HyperintensityValue = t2HyperintensitySelect.value; // Get value from select

        // Basic Validation
        if (preSizeStr === '' || postSizeStr === '') {
            displayError('Please enter both pre-treatment and post-treatment sizes.');
            return;
        }

        const preSize = parseFloat(preSizeStr);
        const postSize = parseFloat(postSizeStr);

        if (isNaN(preSize) || isNaN(postSize) || preSize < 0 || postSize < 0) {
            displayError('Please enter valid, non-negative numbers for sizes.');
            return;
        }

        // --- Category Calculation Logic ---
        let category = '';

        if (postSize === 0) {
            category = 'LR-TR Non-viable';
        } else if (postSize > preSize) {
            // Progression implies Viable
            category = 'LR-TR Viable';
        } else if (postSize > 0 && postSize <= preSize) {
            // Stable or decreased size, initially Non-progressing
            category = 'LR-TR Non-progressing';
            // Check for upgrade based on ancillary features: "Increased" or "New" favor viability
            if (['Increased', 'New'].includes(diffusionRestrictionValue) || ['Increased', 'New'].includes(t2HyperintensityValue)) {
                category = 'LR-TR Viable'; // Upgrade to Viable
            }
        } else {
            // Should not happen with current logic, but good to have a fallback
             displayError('Could not determine category based on inputs.');
             return;
        }
        // --- End of Category Calculation Logic ---

        // Display the result
        calculatedCategorySpan.textContent = category;
        calculatedCategorySpan.style.color = 'green'; // Indicate success
    });

    function displayError(message) {
        calculatedCategorySpan.textContent = 'Error';
        calculatedCategorySpan.style.color = 'red';

        const errorDiv = document.createElement('div');
        errorDiv.textContent = message;
        errorDiv.style.color = 'red';
        errorDiv.style.marginTop = '10px';
        errorDiv.className = 'error-message'; // To help remove it later

        // Add error message below the result span
        resultArea.appendChild(errorDiv);
    }

    // --- Export to Word Functionality ---
    const exportButton = document.getElementById('exportButton');
    const segmentLocationInput = document.getElementById('segmentLocation'); // Need this input

    exportButton.addEventListener('click', function() {
        // Ensure a category has been calculated first
        const category = calculatedCategorySpan.textContent;
        if (category === '---' || category === 'Error') {
            alert('Please calculate the LR-TR category before exporting.');
            return;
        }

        // Get all input values for the report
        const location = segmentLocationInput.value || 'Not specified';
        const preSize = preTreatmentSizeInput.value || 'N/A';
        const postSize = postTreatmentSizeInput.value || 'N/A';
        const diffusion = diffusionRestrictionSelect.value; // Use selected value
        const t2 = t2HyperintensitySelect.value; // Use selected value

        // Use the docx library
        const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "LI-RADS Treatment Response Assessment Report",
                                bold: true,
                                size: 28, // 14pt
                            }),
                        ],
                        heading: HeadingLevel.TITLE,
                        alignment: 'center',
                    }),
                    new Paragraph({ text: `Date: ${new Date().toLocaleDateString()}`, alignment: 'right' }),
                    new Paragraph({ text: "" }), // Spacer

                    new Paragraph({ text: "Patient/Lesion Information:", heading: HeadingLevel.HEADING_1 }),
                    new Paragraph({ text: `Liver Segment(s) Involved: ${location}` }),
                    new Paragraph({ text: "" }),

                    new Paragraph({ text: "Measurements:", heading: HeadingLevel.HEADING_1 }),
                    new Paragraph({ text: `Pre-treatment Enhancing Component Size: ${preSize} mm` }),
                    new Paragraph({ text: `Post-treatment Mass-like Enhancement Size: ${postSize} mm` }),
                     new Paragraph({ text: "" }),

                    new Paragraph({ text: "Ancillary Features:", heading: HeadingLevel.HEADING_1 }),
                    new Paragraph({ text: `Diffusion Restriction: ${diffusion}` }),
                    new Paragraph({ text: `T2 Hyperintensity: ${t2}` }),
                     new Paragraph({ text: "" }),

                    new Paragraph({ text: "Assessment Result:", heading: HeadingLevel.HEADING_1 }),
                    new Paragraph({
                         children: [
                             new TextRun({ text: "Calculated LR-TR Category: ", bold: true}),
                             new TextRun({ text: category, bold: true }),
                         ]
                    }),
                ],
            }],
        });

        // Use Packer to generate the blob and FileSaver to download
        Packer.toBlob(doc).then(blob => {
            console.log("Document blob created");
            saveAs(blob, "LR-TR_Assessment_Report.docx");
            console.log("Document downloaded");
        }).catch(err => {
            console.error("Error generating document:", err);
            alert("Error generating Word document. Check console for details.");
        });
    });
    // --- End of Export to Word Functionality ---

    // --- Preview Report Functionality ---
    const previewButton = document.getElementById('previewButton');
    const previewArea = document.getElementById('previewArea');
    const previewContent = document.getElementById('previewContent');

    previewButton.addEventListener('click', function() {
        // Get all input values for the report
        const location = segmentLocationInput.value || 'Not specified';
        const preSize = preTreatmentSizeInput.value || 'N/A';
        const postSize = postTreatmentSizeInput.value || 'N/A';
        const diffusion = diffusionRestrictionSelect.value; // Use selected value
        const t2 = t2HyperintensitySelect.value; // Use selected value
        const category = calculatedCategorySpan.textContent;

        // Ensure a category has been calculated first
        if (category === '---' || category === 'Error') {
            alert('Please calculate the LR-TR category before previewing.');
            return;
        }

        // Generate the preview content
        let previewText = "LI-RADS Treatment Response Assessment Report\n";
        previewText += `Date: ${new Date().toLocaleDateString()}\n\n`;
        previewText += "Patient/Lesion Information:\n";
        previewText += `Liver Segment(s) Involved: ${location}\n\n`;
        previewText += "Measurements:\n";
        previewText += `Pre-treatment Enhancing Component Size: ${preSize} mm\n`;
        previewText += `Post-treatment Mass-like Enhancement Size: ${postSize} mm\n\n`;
        previewText += "Ancillary Features:\n";
        previewText += `Diffusion Restriction: ${diffusion}\n`;
        previewText += `T2 Hyperintensity: ${t2}\n\n`;
        previewText += "Assessment Result:\n";
        previewText += `Calculated LR-TR Category: ${category}\n`;

        // Display the preview
        previewContent.textContent = previewText;
        previewArea.style.display = 'block';
    });
    // --- End of Preview Report Functionality ---
});

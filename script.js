document.addEventListener('DOMContentLoaded', function() {
    const calculateButton = document.getElementById('calculateButton');
    const calculatedCategorySpan = document.getElementById('calculatedCategory');
    const preTreatmentSizeInput = document.getElementById('preTreatmentSize');
    const postTreatmentSizeInput = document.getElementById('postTreatmentSize');
    const diffusionRestrictionSelect = document.getElementById('diffusionRestriction');
    const t2HyperintensitySelect = document.getElementById('t2Hyperintensity');
    const therapyModalitySelect = document.getElementById('therapyModality'); // New element
    const lrtDateInput = document.getElementById('lrtDate'); // New element
    const systemicTherapyWarning = document.getElementById('systemicTherapyWarning'); // New element
    const resultArea = document.getElementById('resultArea'); // To display errors

    // --- Event Listener for Modality Change ---
    therapyModalitySelect.addEventListener('change', function() {
        const selectedModality = this.value;
        if (selectedModality === 'Systemic') {
            systemicTherapyWarning.style.display = 'block';
            calculateButton.disabled = true;
            calculatedCategorySpan.textContent = '---'; // Clear result if systemic is chosen
            calculatedCategorySpan.style.color = 'inherit';
             // Clear any previous error messages specifically related to calculation
            const existingError = resultArea.querySelector('.error-message');
            if (existingError) existingError.remove();
            displayError('Calculation disabled: Systemic therapy selected. This tool is for radiation LRT.'); // Display specific info
        } else {
            systemicTherapyWarning.style.display = 'none';
            calculateButton.disabled = false;
             // Clear the systemic therapy warning message if present
            const existingError = resultArea.querySelector('.error-message');
            if (existingError && existingError.textContent.includes('Systemic therapy selected')) {
                 existingError.remove();
                 calculatedCategorySpan.textContent = '---'; // Reset category display
                 calculatedCategorySpan.style.color = 'inherit';
            }
        }
    });

    calculateButton.addEventListener('click', function() {
        // Clear previous errors/results (except systemic warning)
        const existingError = resultArea.querySelector('.error-message');
         if (existingError && !existingError.textContent.includes('Systemic therapy selected')) {
             existingError.remove();
         }
         // Reset category display only if not showing systemic error
         if (therapyModalitySelect.value !== 'Systemic') {
            calculatedCategorySpan.textContent = '---';
            calculatedCategorySpan.style.color = 'inherit';
         }
        // The existingError variable was already declared at the start of this listener.
        // We just need to check if it exists and remove it if it does.
        if (existingError) {
            existingError.remove();
        }

        // Get input values
        const therapyModality = therapyModalitySelect.value;
        const lrtDateStr = lrtDateInput.value;
        const preSizeStr = preTreatmentSizeInput.value;
        const postSizeStr = postTreatmentSizeInput.value;
        const diffusionRestrictionValue = diffusionRestrictionSelect.value;
        const t2HyperintensityValue = t2HyperintensitySelect.value;

        // --- Comprehensive Validation ---
        if (therapyModality === '') {
             displayError('Please select the therapy modality.');
             return;
        }
        // Systemic check (redundant due to button disable, but safe)
        if (therapyModality === 'Systemic') {
             displayError('Calculation disabled: Systemic therapy selected.');
             return;
        }
         if (lrtDateStr === '') {
            displayError('Please enter the date of the latest LRT.');
            return;
        }
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

        // Add error message below the result span, ensuring only one error message is present
        const existingErrorMsg = resultArea.querySelector('.error-message');
        if (!existingErrorMsg) { // Add only if no error message exists
             resultArea.appendChild(errorDiv);
        } else { // Replace existing error message content
            existingErrorMsg.textContent = message;
            existingErrorMsg.style.color = 'red'; // Ensure it's red
        }
    }

     // --- Helper Function to Calculate Time Since LRT ---
     function calculateTimeSince(dateString) {
        if (!dateString) return 'N/A';
        try {
            const lrtDate = new Date(dateString);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalize today's date to the beginning of the day
            lrtDate.setHours(0, 0, 0, 0); // Normalize LRT date

            if (isNaN(lrtDate.getTime())) return 'Invalid Date';
            if (lrtDate > today) return 'Future Date';

            let years = today.getFullYear() - lrtDate.getFullYear();
            let months = today.getMonth() - lrtDate.getMonth();
            let days = today.getDate() - lrtDate.getDate();

            if (days < 0) {
                months--;
                // Get days in the previous month
                const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                days += prevMonth.getDate();
            }

            if (months < 0) {
                years--;
                months += 12;
            }

            let result = [];
            if (years > 0) result.push(`${years} year${years > 1 ? 's' : ''}`);
            if (months > 0) result.push(`${months} month${months > 1 ? 's' : ''}`);
            // Only show days if the difference is less than a month or if years/months are zero
            if (years === 0 && months === 0 || days > 0) {
                 // Handle the case where the date is today
                 if (years === 0 && months === 0 && days === 0 && lrtDate.getTime() === today.getTime()) {
                     result.push("Today");
                 } else if (days > 0) {
                     result.push(`${days} day${days > 1 ? 's' : ''}`);
                 }
            }


            return result.length > 0 ? result.join(', ') : 'Today';
        } catch (e) {
            console.error("Error calculating time since LRT:", e);
            return 'Calculation Error';
        }
    }


    // --- Export to Word Functionality ---
    const exportButton = document.getElementById('exportButton');
    const segmentLocationInput = document.getElementById('segmentLocation'); // Need this input

    exportButton.addEventListener('click', function() {
        // Ensure a category has been calculated first (and modality is not Systemic)
        const category = calculatedCategorySpan.textContent;
        const selectedModality = therapyModalitySelect.value;

        if (selectedModality === 'Systemic') {
             alert('Cannot export report for Systemic therapy using this tool.');
             return;
        }
        if (category === '---' || category === 'Error') {
            alert('Please calculate a valid LR-TR category before exporting.');
            return;
        }

        // Get all input values for the report
        const location = segmentLocationInput.value || 'Not specified';
        const modalityText = therapyModalitySelect.options[therapyModalitySelect.selectedIndex].text; // Get full text
        const lrtDate = lrtDateInput.value || 'N/A';
        const timeSinceLRT = calculateTimeSince(lrtDate);
        const preSize = preTreatmentSizeInput.value || 'N/A';
        const postSize = postTreatmentSizeInput.value || 'N/A';
        const diffusion = diffusionRestrictionSelect.value;
        const t2 = t2HyperintensitySelect.value;

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

                    new Paragraph({ text: "Therapy Information:", heading: HeadingLevel.HEADING_1 }), // New Section
                    new Paragraph({ text: `Modality of Latest Therapy: ${modalityText}` }),
                    new Paragraph({ text: `Date of Latest LRT: ${lrtDate === 'N/A' ? 'N/A' : new Date(lrtDate).toLocaleDateString()}` }), // Format date nicely
                    new Paragraph({ text: `Time Since Latest LRT: ${timeSinceLRT}` }),
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
        const modalityText = therapyModalitySelect.options[therapyModalitySelect.selectedIndex].text;
        const lrtDate = lrtDateInput.value || 'N/A';
        const timeSinceLRT = calculateTimeSince(lrtDate);
        const preSize = preTreatmentSizeInput.value || 'N/A';
        const postSize = postTreatmentSizeInput.value || 'N/A';
        const diffusion = diffusionRestrictionSelect.value;
        const t2 = t2HyperintensitySelect.value;
        const category = calculatedCategorySpan.textContent;
        const selectedModality = therapyModalitySelect.value;

        // Ensure a category has been calculated first (and modality is not Systemic)
         if (selectedModality === 'Systemic') {
             alert('Cannot preview report for Systemic therapy using this tool.');
             return;
        }
        if (category === '---' || category === 'Error') {
            alert('Please calculate a valid LR-TR category before previewing.');
            return;
        }

        // Generate the preview content
        let previewText = "LI-RADS Treatment Response Assessment Report\n";
        previewText += `Date: ${new Date().toLocaleDateString()}\n\n`;
        previewText += "Patient/Lesion Information:\n";
        previewText += `Liver Segment(s) Involved: ${location}\n\n`;
        previewText += "Therapy Information:\n"; // New Section
        previewText += `Modality of Latest Therapy: ${modalityText}\n`;
        previewText += `Date of Latest LRT: ${lrtDate === 'N/A' ? 'N/A' : new Date(lrtDate).toLocaleDateString()}\n`; // Format date
        previewText += `Time Since Latest LRT: ${timeSinceLRT}\n\n`;
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

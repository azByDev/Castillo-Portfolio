// Wait for the HTML document to fully load before running the script
document.addEventListener("DOMContentLoaded", () => {
  // 1. Smooth scrolling for internal anchors
  const scrollLinks = document.querySelectorAll('nav a, .service-link, a[href^="#"]:not(#emailDirectLink)');
  scrollLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId && targetId.startsWith("#") && targetId.length > 1) {
        try {
          const targetSection = document.querySelector(targetId);
          if (targetSection) {
            e.preventDefault();
            targetSection.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });

            // Check if link was one of the lesson cards to preselect the level
            if (this.classList.contains("service-link")) {
              const levelSelect = document.getElementById("currentLevel");
              if (levelSelect) {
                const text = this.textContent;
                if (text.includes("Beginner")) {
                  levelSelect.value = "Beginner (A1) - No prior knowledge";
                } else if (text.includes("Intermediate")) {
                  levelSelect.value = "Intermediate (B1) - Independent user";
                } else if (text.includes("Exam Prep")) {
                  levelSelect.value = "Exam Preparation (Goethe / telc)";
                }
                // Flash focus on level selector
                levelSelect.focus();
              }
            }
          }
        } catch (err) {
          // Safely ignore if not a valid DOM query
        }
      }
    });
  });

  // 2. Timezone Detection
  try {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzOffsetMinutes = new Date().getTimezoneOffset();
    const tzHours = -Math.floor(tzOffsetMinutes / 60);
    const tzSign = tzHours >= 0 ? "+" : "";
    const tzDisplay = `${userTimezone} (UTC${tzSign}${tzHours})`;

    const tzElement = document.getElementById("userTimezoneDisplay");
    if (tzElement) {
      tzElement.textContent = tzDisplay;
    }
  } catch (err) {
    const tzElement = document.getElementById("userTimezoneDisplay");
    if (tzElement) {
      tzElement.textContent = "UTC / Local Time";
    }
  }

  // Set minimum date for start date to today
  const startDateInput = document.getElementById("startDate");
  if (startDateInput) {
    const today = new Date().toISOString().split("T")[0];
    startDateInput.min = today;
  }

  // 3. Dynamic Estimate Calculation
  const frequencySelect = document.getElementById("lessonFrequency");
  const estimateValueSpan = document.getElementById("estimateValue");
  const hourlyRate = 40;

  function updateEstimate() {
    if (!frequencySelect || !estimateValueSpan) return;
    const freq = parseFloat(frequencySelect.value) || 1;
    if (freq === 0.5) {
      estimateValueSpan.textContent = `€${hourlyRate}.00 every 2 weeks (1 bi-weekly session)`;
    } else {
      const weekly = (freq * hourlyRate).toFixed(2);
      const sessionLabel = freq === 1 ? "1 session" : `${freq} sessions`;
      estimateValueSpan.textContent = `€${weekly} / week (${sessionLabel})`;
    }
  }

  if (frequencySelect) {
    frequencySelect.addEventListener("change", updateEstimate);
  }

  // 4. Form Validation & Submission
  const form = document.getElementById("tutoring-registration-form");
  const modal = document.getElementById("confirmationModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const copySummaryBtn = document.getElementById("copySummaryBtn");
  const emailDirectLink = document.getElementById("emailDirectLink");
  const summaryList = document.getElementById("summaryList");
  const confirmName = document.getElementById("confirmName");
  const confirmEmail = document.getElementById("confirmEmail");

  let lastSubmissionText = "";

  function clearErrors() {
    document.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
    document.querySelectorAll(".error-border").forEach((el) => el.classList.remove("error-border"));
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      clearErrors();

      let isValid = true;
      let firstErrorField = null;

      // Full Name Validation
      const fullName = document.getElementById("fullName");
      if (!fullName.value.trim()) {
        document.getElementById("fullNameError").textContent = "Please enter your full name.";
        fullName.classList.add("error-border");
        isValid = false;
        firstErrorField = firstErrorField || fullName;
      }

      // Email Validation
      const email = document.getElementById("email");
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
        document.getElementById("emailError").textContent = "Please provide a valid email address.";
        email.classList.add("error-border");
        isValid = false;
        firstErrorField = firstErrorField || email;
      }

      // Country of Location Validation
      const country = document.getElementById("country");
      if (!country.value) {
        document.getElementById("countryError").textContent = "Please select your country of location.";
        country.classList.add("error-border");
        isValid = false;
        firstErrorField = firstErrorField || country;
      }

      // Current German Level Validation
      const currentLevel = document.getElementById("currentLevel");
      if (!currentLevel.value) {
        document.getElementById("currentLevelError").textContent = "Please choose your current German level.";
        currentLevel.classList.add("error-border");
        isValid = false;
        firstErrorField = firstErrorField || currentLevel;
      }

      // Preferred Days Validation (at least one checkbox checked)
      const selectedDays = Array.from(
        document.querySelectorAll('input[name="preferredDays"]:checked')
      ).map((el) => el.value);

      if (selectedDays.length === 0) {
        document.getElementById("preferredDaysError").textContent =
          "Please pick at least one preferred day of the week.";
        isValid = false;
        if (!firstErrorField) {
          const firstDay = document.querySelector('input[name="preferredDays"]');
          firstErrorField = firstDay;
        }
      }

      // Preferred Time Validation
      const preferredTimeOfDay = document.getElementById("preferredTimeOfDay");
      if (!preferredTimeOfDay.value) {
        document.getElementById("preferredTimeError").textContent =
          "Please select your preferred time of day.";
        preferredTimeOfDay.classList.add("error-border");
        isValid = false;
        firstErrorField = firstErrorField || preferredTimeOfDay;
      }

      // Rate Amenability Validation
      const rateSelected = document.querySelector('input[name="rateAmenability"]:checked');
      if (!rateSelected) {
        document.getElementById("rateAmenabilityError").textContent =
          "Please select whether you are amenable to the hourly rate.";
        isValid = false;
      }

      if (!isValid) {
        if (firstErrorField) {
          firstErrorField.focus();
        }
        return;
      }

      // Form Data extraction
      const phone = document.getElementById("phone").value.trim() || "Not provided";
      const lessonFormat = document.getElementById("lessonFormat").value;
      const lessonFrequencyText =
        frequencySelect.options[frequencySelect.selectedIndex].text;
      const startDate = document.getElementById("startDate").value || "Flexible / As soon as possible";
      const durationPref = document.getElementById("durationPreference").value;
      const goals = document.getElementById("goals").value.trim() || "None specified";
      const notes = document.getElementById("additionalNotes").value.trim() || "None";
      const detectedTz = document.getElementById("userTimezoneDisplay").textContent;

      // Populate summary modal
      confirmName.textContent = fullName.value.trim();
      confirmEmail.textContent = email.value.trim();

      const summaryItems = [
        { label: "Student Name", value: fullName.value.trim() },
        { label: "Email", value: email.value.trim() },
        { label: "Phone / WhatsApp", value: phone },
        { label: "Country of Location", value: country.value },
        { label: "Detected Timezone", value: detectedTz },
        { label: "German Level", value: currentLevel.value },
        { label: "Lesson Format", value: lessonFormat },
        { label: "Preferred Days", value: selectedDays.join(", ") },
        { label: "Time Window", value: preferredTimeOfDay.value },
        { label: "Frequency", value: lessonFrequencyText },
        { label: "Target Start Date", value: startDate },
        { label: "Lesson Duration", value: durationPref },
        { label: "Hourly Rate Amenability", value: rateSelected.value },
        { label: "Learning Goals", value: goals },
        { label: "Additional Notes", value: notes },
      ];

      summaryList.innerHTML = summaryItems
        .map(
          (item) =>
            `<li><strong>${item.label}:</strong> <span>${escapeHtml(item.value)}</span></li>`
        )
        .join("");

      // Prepare text for copying and for mailto
      lastSubmissionText = `=== GERMAN TUTORING REGISTRATION ===\n` +
        summaryItems.map((item) => `${item.label}: ${item.value}`).join("\n");

      // Construct mailto link so user or tutor can easily send the inquiry
      const subject = encodeURIComponent(
        `Tutoring Registration: ${fullName.value.trim()} (${country.value}) - ${currentLevel.value}`
      );
      const body = encodeURIComponent(
        `Hello Reema,\n\nI would like to register for German tutoring lessons. Here are my details and schedule preferences:\n\n` +
          summaryItems.map((item) => `• ${item.label}: ${item.value}`).join("\n") +
          `\n\nLooking forward to hearing from you!\n\nBest regards,\n${fullName.value.trim()}`
      );
      emailDirectLink.href = `mailto:reema.castillo.goethe@gmail.com?subject=${subject}&body=${body}`;

      // Open modal
      modal.removeAttribute("hidden");
      modal.focus();
    });
  }

  // 5. Modal interactions
  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener("click", () => {
      modal.setAttribute("hidden", "true");
      form.reset();
      updateEstimate();
      clearErrors();
    });
  }

  // Close modal when clicking outside of the modal card
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.setAttribute("hidden", "true");
      }
    });
  }

  // Copy Summary button
  if (copySummaryBtn) {
    copySummaryBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(lastSubmissionText);
        const originalText = copySummaryBtn.innerHTML;
        copySummaryBtn.innerHTML = "✅ Copied to Clipboard!";
        setTimeout(() => {
          copySummaryBtn.innerHTML = originalText;
        }, 2500);
      } catch (err) {
        alert("Summary copied to clipboard!");
      }
    });
  }

  // Utility helper
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Initialize estimate on load
  updateEstimate();
});

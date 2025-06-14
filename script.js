const gradeMap = {
  S: 10,
  "A+": 9,
  A: 8.5,
  "B+": 8,
  B: 7.5,
  "C+": 7,
  C: 6.5,
  D: 6,
  P: 5.5,
};

function saveToLocalStorage() {
  const semester = document.getElementById("semester").value;
  const subjects = [];
  document.querySelectorAll(".subject-row").forEach((row) => {
    const name = row.querySelector(".subject-name").value.trim();
    const credit = row.querySelector(".credit").value;
    const grade = row.querySelector(".grade").value;
    if (name && credit && grade) {
      subjects.push({ name, credit, grade });
    }
  });
  localStorage.setItem("sgpa-semester", semester);
  localStorage.setItem("sgpa-subjects", JSON.stringify(subjects));
}

function loadFromLocalStorage() {
  const savedSemester = localStorage.getItem("sgpa-semester");
  const savedSubjects = JSON.parse(localStorage.getItem("sgpa-subjects") || "[]");
  if (savedSemester) {
    document.getElementById("semester").value = savedSemester;
  }
  const container = document.getElementById("subjects-container");
  container.innerHTML = "";
  if (savedSubjects.length > 0) {
    savedSubjects.forEach(({ name, credit, grade }) => {
      addSubjectRow(name, credit, grade);
    });
  } else {
    // Add just ONE empty subject row on load
    addSubjectRow("", "", "S");
  }
}

function addSubjectRow(name = "", credit = "", grade = "S") {
  const container = document.getElementById("subjects-container");
  const row = document.createElement("div");
  row.className = "subject-row";
  row.innerHTML = `
    <input type="text" class="subject-name" value="${name}" placeholder="Subject Name" required />
    <input type="number" class="credit" value="${credit}" placeholder="Credits" required min="1" step="0.5" />
    <select class="grade" required>
      ${Object.keys(gradeMap)
        .map(
          (g) =>
            `<option value="${g}" ${g === grade ? "selected" : ""}>${g}</option>`
        )
        .join("")}
    </select>
    <button type="button" class="delete-btn" title="Delete Subject">×</button>
  `;

  row.querySelector(".delete-btn").addEventListener("click", () => {
    row.remove();
    saveToLocalStorage();
    if (!document.getElementById("summary").classList.contains("hidden")) {
      document.getElementById("sgpa-form").dispatchEvent(new Event("submit"));
    }
  });

  row.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("input", () => {
      saveToLocalStorage();
    });
  });

  container.appendChild(row);
  saveToLocalStorage();
}

document.getElementById("add-subject").addEventListener("click", () => {
  addSubjectRow();
});

document.getElementById("sgpa-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const names = Array.from(document.querySelectorAll(".subject-name")).map((i) =>
    i.value.trim()
  );
  const credits = Array.from(document.querySelectorAll(".credit")).map((i) =>
    parseFloat(i.value)
  );
  const grades = Array.from(document.querySelectorAll(".grade")).map(
    (i) => i.value
  );

  // Validate inputs
  for (let i = 0; i < names.length; i++) {
    if (!names[i] || !credits[i] || isNaN(credits[i]) || credits[i] <= 0) {
      alert(
        `Please enter valid Subject name and credits for row ${i + 1} (credits > 0).`
      );
      return;
    }
  }

  const semester = document.getElementById("semester").value;
  if (!semester) {
    alert("Please select a semester.");
    return;
  }

  // Calculate SGPA
  let totalPoints = 0;
  let totalCredits = 0;
  for (let i = 0; i < credits.length; i++) {
    totalPoints += credits[i] * gradeMap[grades[i]];
    totalCredits += credits[i];
  }
  const sgpa = totalPoints / totalCredits;

  // Show summary
  const summary = document.getElementById("summary");
  const displaySemester = document.getElementById("display-semester");
  const summaryBody = document.getElementById("summary-body");
  const resultDiv = document.getElementById("result");
  const exportBtn = document.getElementById("export-pdf");

  displaySemester.textContent = semester;
  summaryBody.innerHTML = "";

  for (let i = 0; i < names.length; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${names[i]}</td>
      <td>${credits[i]}</td>
      <td>${grades[i]}</td>
    `;
    summaryBody.appendChild(tr);
  }

  resultDiv.textContent = `Your SGPA is ${sgpa.toFixed(2)}`;
  summary.classList.remove("hidden");
  exportBtn.classList.remove("hidden");

  saveToLocalStorage();
});

document.getElementById("export-pdf").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const semester = document.getElementById("semester").value;
  const rows = [];
  document.querySelectorAll("#summary-body tr").forEach((tr) => {
    const cols = tr.querySelectorAll("td");
    rows.push([cols[0].textContent, cols[1].textContent, cols[2].textContent]);
  });

  doc.setFontSize(18);
  doc.setTextColor("#4a47a3");
  doc.text(`SGPA Summary - ${semester}`, 14, 20);

  // Table headers
  doc.setFontSize(14);
  doc.setTextColor("#ffffff");
  doc.setFillColor(74, 71, 163);
  doc.rect(14, 25, 182, 10, "F");
  doc.text("Subject", 20, 32);
  doc.text("Credits", 110, 32);
  doc.text("Grade", 160, 32);

  // Table rows
  let y = 38;
  rows.forEach(([subject, credits, grade], i) => {
    doc.setFillColor(i % 2 === 0 ? 243 : 255, 243, 255); // alternating light purple/white rows
    doc.rect(14, y - 7, 182, 10, "F");
    doc.setTextColor("#333");
    doc.text(subject, 20, y);
    doc.text(credits.toString(), 110, y);
    doc.text(grade, 160, y);
    y += 10;
  });

  // SGPA
  const sgpaText = document.getElementById("result").textContent;
  doc.setFontSize(16);
  doc.setTextColor("#4caf50");
  doc.text(sgpaText, 14, y + 10);

  doc.save(`SGPA_Summary_${semester.replace(/\s+/g, "_")}.pdf`);
});

// On load:
window.addEventListener("load", () => {
  loadFromLocalStorage();
});

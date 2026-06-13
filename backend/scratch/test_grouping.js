const raw = [
  {
    "classId": 9,
    "className": "2",
    "sectionId": 5,
    "sectionName": "Section A",
    "subjectId": 1,
    "subjectName": "Mathematics"
  },
  {
    "classId": 9,
    "className": "2",
    "sectionId": 5,
    "sectionName": "Section A",
    "subjectId": 2,
    "subjectName": "Science"
  },
  {
    "classId": 9,
    "className": "2",
    "sectionId": 5,
    "sectionName": "Section A",
    "subjectId": 4,
    "subjectName": "English"
  },
  {
    "classId": 9,
    "className": "2",
    "sectionId": 6,
    "sectionName": "Section B",
    "subjectId": 4,
    "subjectName": "English"
  }
];

const grouped = [];
raw.forEach(a => {
  let cls = grouped.find(c => c.classId === a.classId);
  if (!cls) { cls = { classId: a.classId, className: a.className, sections: [] }; grouped.push(cls); }
  let sec = cls.sections.find(s => s.sectionId === a.sectionId);
  if (!sec) { sec = { sectionId: a.sectionId, sectionName: String(a.sectionName || '').trim(), subjects: [] }; cls.sections.push(sec); }
  if (!sec.subjects.find(s => s.subjectId === a.subjectId)) { sec.subjects.push({ subjectId: a.subjectId, subjectName: a.subjectName }); }
});

console.log("GROUPED:");
console.log(JSON.stringify(grouped, null, 2));

const selClassId = 9;
const foundClass = grouped.find(c => String(c.classId) === String(selClassId));
console.log("\nFOUND CLASS sections:");
console.log(JSON.stringify(foundClass?.sections, null, 2));

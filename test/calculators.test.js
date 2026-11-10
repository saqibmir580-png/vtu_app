/**
 * Unit Tests: VTU Academic Calculators & Attendance Logic
 * Executes with Node test runner / assert
 */

const assert = require('assert');

// 1. VTU Grade Scale Definition
const VTU_GRADE_SCALE = [
  { grade: 'O', gradePoint: 10, minMarks: 90, maxMarks: 100 },
  { grade: 'A+', gradePoint: 9, minMarks: 80, maxMarks: 89 },
  { grade: 'A', gradePoint: 8, minMarks: 70, maxMarks: 79 },
  { grade: 'B+', gradePoint: 7, minMarks: 60, maxMarks: 69 },
  { grade: 'B', gradePoint: 6, minMarks: 50, maxMarks: 59 },
  { grade: 'C', gradePoint: 5, minMarks: 45, maxMarks: 49 },
  { grade: 'P', gradePoint: 4, minMarks: 40, maxMarks: 44 },
  { grade: 'F', gradePoint: 0, minMarks: 0, maxMarks: 39 },
];

function getGradeFromMarks(marks) {
  const match = VTU_GRADE_SCALE.find((g) => marks >= g.minMarks && marks <= g.maxMarks);
  return match ? { grade: match.grade, gradePoint: match.gradePoint } : { grade: 'F', gradePoint: 0 };
}

function calculateSgpa(subjects) {
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
  const totalPoints = subjects.reduce((sum, s) => sum + s.credits * s.gradePoint, 0);
  const sgpa = totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
  const percentage = sgpa > 0.75 ? Math.min(100, (sgpa - 0.75) * 10).toFixed(2) : '0.00';
  return { sgpa, totalCredits, percentage };
}

function computeCgpa(records) {
  const completed = records.filter((r) => r.isCompleted && r.sgpa > 0);
  if (completed.length === 0) return { cgpa: 0, totalCredits: 0 };
  const totalPoints = completed.reduce((sum, r) => sum + r.sgpa * r.credits, 0);
  const totalCredits = completed.reduce((sum, r) => sum + r.credits, 0);
  const cgpa = totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
  return { cgpa, totalCredits };
}

function getClassification(cgpa) {
  if (cgpa >= 7.75) return 'First Class with Distinction (FCD)';
  if (cgpa >= 6.75) return 'First Class (FC)';
  if (cgpa >= 5.75) return 'Second Class (SC)';
  if (cgpa >= 5.00) return 'Pass Class';
  return 'Below Passing Grade';
}

function calculateAttendanceResult(attended, conducted, target, mode) {
  const currentPercentage = conducted > 0 ? (attended / conducted) * 100 : 0;
  const roundCurrent = Math.round(currentPercentage * 10) / 10;

  let requiredClassesToReachTarget = 0;
  let missableClassesCount = 0;
  let projectedPercentage = roundCurrent;

  if (mode === 'REACH_TARGET') {
    if (currentPercentage >= target) {
      requiredClassesToReachTarget = 0;
    } else {
      const req = Math.ceil((target * conducted - 100 * attended) / (100 - target));
      requiredClassesToReachTarget = Math.max(1, req);
      const newAttended = attended + requiredClassesToReachTarget;
      const newConducted = conducted + requiredClassesToReachTarget;
      projectedPercentage = Math.round((newAttended / newConducted) * 1000) / 10;
    }
  } else {
    if (currentPercentage < target) {
      missableClassesCount = 0;
    } else {
      const miss = Math.floor((100 * attended - target * conducted) / target);
      missableClassesCount = Math.max(0, miss);
      const newConducted = conducted + missableClassesCount;
      projectedPercentage = Math.round((attended / newConducted) * 1000) / 10;
    }
  }

  return {
    currentPercentage: roundCurrent,
    targetPercentage: target,
    requiredClassesToReachTarget,
    missableClassesCount,
    projectedPercentage,
  };
}

console.log('Testing VTU Academic Calculator Logic...');

// 1. Grade Scale Mapping Tests
assert.strictEqual(getGradeFromMarks(95).grade, 'O');
assert.strictEqual(getGradeFromMarks(95).gradePoint, 10);
assert.strictEqual(getGradeFromMarks(84).grade, 'A+');
assert.strictEqual(getGradeFromMarks(84).gradePoint, 9);
assert.strictEqual(getGradeFromMarks(71).grade, 'A');
assert.strictEqual(getGradeFromMarks(71).gradePoint, 8);
assert.strictEqual(getGradeFromMarks(60).grade, 'B+');
assert.strictEqual(getGradeFromMarks(60).gradePoint, 7);
assert.strictEqual(getGradeFromMarks(53).grade, 'B');
assert.strictEqual(getGradeFromMarks(53).gradePoint, 6);
assert.strictEqual(getGradeFromMarks(46).grade, 'C');
assert.strictEqual(getGradeFromMarks(46).gradePoint, 5);
assert.strictEqual(getGradeFromMarks(40).grade, 'P');
assert.strictEqual(getGradeFromMarks(40).gradePoint, 4);
assert.strictEqual(getGradeFromMarks(32).grade, 'F');
assert.strictEqual(getGradeFromMarks(32).gradePoint, 0);
console.log('  ✓ Grade scale mapping verified (O through F)');

// 2. SGPA Calculation Tests
const sampleSubjects = [
  { name: 'Subject 1', credits: 4, gradePoint: 9 }, // 36
  { name: 'Subject 2', credits: 4, gradePoint: 8 }, // 32
  { name: 'Subject 3', credits: 4, gradePoint: 10 }, // 40
  { name: 'Subject 4', credits: 3, gradePoint: 7 }, // 21
  { name: 'Subject 5', credits: 3, gradePoint: 8 }, // 24
  { name: 'Subject 6', credits: 2, gradePoint: 10 }, // 20
]; // Total Credits: 20, Total Points: 173 -> SGPA = 8.65
const sgpaResult = calculateSgpa(sampleSubjects);
assert.strictEqual(sgpaResult.totalCredits, 20);
assert.strictEqual(sgpaResult.sgpa, 8.65);
// Official VTU Percentage: (8.65 - 0.75) * 10 = 7.90 * 10 = 79.00%
assert.strictEqual(sgpaResult.percentage, '79.00');
console.log('  ✓ SGPA calculation & VTU percentage conversion verified');

// 3. CGPA & Classification Tests
const semesterRecords = [
  { semester: 1, sgpa: 8.50, credits: 20, isCompleted: true },
  { semester: 2, sgpa: 8.60, credits: 20, isCompleted: true },
  { semester: 3, sgpa: 8.80, credits: 24, isCompleted: true },
  { semester: 4, sgpa: 8.95, credits: 24, isCompleted: true },
];
const cgpaResult = computeCgpa(semesterRecords);
// (8.50*20 + 8.60*20 + 8.80*24 + 8.95*24) / (20 + 20 + 24 + 24)
// = (170 + 172 + 211.2 + 214.8) / 88 = 768 / 88 = 8.7272... -> 8.73
assert.strictEqual(cgpaResult.totalCredits, 88);
assert.strictEqual(cgpaResult.cgpa, 8.73);
assert.strictEqual(getClassification(cgpaResult.cgpa), 'First Class with Distinction (FCD)');
assert.strictEqual(getClassification(7.00), 'First Class (FC)');
assert.strictEqual(getClassification(6.00), 'Second Class (SC)');
assert.strictEqual(getClassification(5.20), 'Pass Class');
console.log('  ✓ Cumulative CGPA and VTU award classifications verified');

// 4. Attendance Calculator Tests (VTU 85% Rule)
// Case A: Below target (Attended: 20, Conducted: 28, Target: 85%)
// Target = 85%, Current = 71.4%. Need to attend 26 consecutive classes.
const reachTargetResult = calculateAttendanceResult(20, 28, 85, 'REACH_TARGET');
assert.strictEqual(reachTargetResult.requiredClassesToReachTarget, 26);
assert.strictEqual(reachTargetResult.projectedPercentage, 85.2);

// Case B: Above target (Attended: 32, Conducted: 35, Target: 85%)
// Target = 85%, Current = 91.4%. Can miss 2 classes.
const canMissResult = calculateAttendanceResult(32, 35, 85, 'CAN_MISS');
assert.strictEqual(canMissResult.missableClassesCount, 2);
assert.strictEqual(canMissResult.projectedPercentage, 86.5);
console.log('  ✓ Attendance 85% rule (consecutive required vs missable) verified');

console.log('VTU Academic Calculator test suite completed successfully!\n');

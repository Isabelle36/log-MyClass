export const CURRICULUM_BY_DEPARTMENT_YEAR: Record<string, Record<number, string[]>> = {
  BCA: {
    1: [
      "Computer Fundamentals",
      "Lab Computer Fundamentals",
      "Operating System",
      "Digital Circuits",
      "Algorithm",
      "English",
      "Computer C Language",
      "Mathematics",
      "Urdu / Hindi",
      "Programming C",
    ],
    2: [
      "Computer C++",
      "Lab C++",
      "Data Structures Using C",
      "DBMS",
      "Computer Networking",
      "SAD",
      "Mathematics",
      "Urdu / Hindi",
      "Computer Lab",
      "English",
    ],
    3: [
      "Java",
      "Java Lab",
      "WPVB",
      "WPVB Lab",
      "E-Commerce",
      "Artificial Intelligence",
      "ICWD",
      "ICWD Lab",
      "English Communication",
    ],
  },
  BBA: {
    1: [
      "Business Communication",
      "Principles of Management",
      "Financial Accounting",
      "Business Mathematics",
      "Microeconomics",
    ],
    2: [
      "Organizational Behavior",
      "Marketing Management",
      "Business Statistics",
      "Cost Accounting",
      "Macroeconomics",
    ],
    3: [
      "Human Resource Management",
      "Financial Management",
      "Operations Management",
      "Business Law",
      "Entrepreneurship",
    ],
  },
}

export function getSubjectsForDepartmentYear(department: string, year: number) {
  const normalizedDepartment = department.trim().toUpperCase()
  return CURRICULUM_BY_DEPARTMENT_YEAR[normalizedDepartment]?.[year] ?? []
}

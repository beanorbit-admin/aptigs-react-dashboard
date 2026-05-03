export const categories = [
  { id: 1, name: 'UG' },
  { id: 2, name: 'PG' },
  { id: 3, name: 'Diploma' },
]

export const courses = [
  { id: 1, title: 'BCA', categoryId: 1, category: 'UG', duration: '3 Years', fee: 45000, status: 'Active', teacherIds: [1], description: 'Bachelor of Computer Applications' },
  { id: 2, title: 'MCA', categoryId: 2, category: 'PG', duration: '2 Years', fee: 55000, status: 'Active', teacherIds: [1, 2], description: 'Master of Computer Applications' },
  { id: 3, title: 'BBA', categoryId: 1, category: 'UG', duration: '3 Years', fee: 40000, status: 'Active', teacherIds: [2], description: 'Bachelor of Business Administration' },
  { id: 4, title: 'MBA', categoryId: 2, category: 'PG', duration: '2 Years', fee: 60000, status: 'Active', teacherIds: [1], description: 'Master of Business Administration' },
  { id: 5, title: 'DCA', categoryId: 3, category: 'Diploma', duration: '1 Year', fee: 20000, status: 'Inactive', teacherIds: [], description: 'Diploma in Computer Applications' },
]

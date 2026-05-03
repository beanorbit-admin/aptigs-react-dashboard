export const semesters = [
  { id: 1, courseId: 1, name: 'Semester 1', description: 'Foundation courses covering programming basics and mathematics', order: 1 },
  { id: 2, courseId: 1, name: 'Semester 2', description: 'Intermediate topics in data structures and database systems', order: 2 },
  { id: 3, courseId: 1, name: 'Semester 3', description: 'Advanced programming and software engineering principles', order: 3 },
  { id: 4, courseId: 2, name: 'Semester 1', description: 'Advanced computing concepts and algorithm design', order: 1 },
  { id: 5, courseId: 2, name: 'Semester 2', description: 'System design, distributed computing and cloud', order: 2 },
]

export const subjects = [
  { id: 1, semesterId: 1, courseId: 1, name: 'Introduction to Programming', description: 'Basics of C and Python programming languages', order: 1 },
  { id: 2, semesterId: 1, courseId: 1, name: 'Mathematics I', description: 'Calculus, linear algebra and discrete mathematics', order: 2 },
  { id: 3, semesterId: 1, courseId: 1, name: 'Digital Logic', description: 'Boolean algebra, logic gates and circuits', order: 3 },
  { id: 4, semesterId: 2, courseId: 1, name: 'Data Structures', description: 'Arrays, linked lists, trees and graphs', order: 1 },
  { id: 5, semesterId: 2, courseId: 1, name: 'Database Management', description: 'SQL, normalization and transaction management', order: 2 },
  { id: 6, semesterId: 4, courseId: 2, name: 'Advanced Algorithms', description: 'Complexity analysis and algorithm design patterns', order: 1 },
  { id: 7, semesterId: 4, courseId: 2, name: 'Computer Networks', description: 'TCP/IP, routing protocols and network security', order: 2 },
]

export const chapters = [
  { id: 1, subjectId: 1, semesterId: 1, courseId: 1, name: 'Introduction to C', description: 'Variables, data types, operators and control flow', order: 1 },
  { id: 2, subjectId: 1, semesterId: 1, courseId: 1, name: 'Functions and Arrays', description: 'Function definitions, recursion, and array operations', order: 2 },
  { id: 3, subjectId: 2, semesterId: 1, courseId: 1, name: 'Differential Calculus', description: 'Limits, derivatives and their applications', order: 1 },
  { id: 4, subjectId: 2, semesterId: 1, courseId: 1, name: 'Linear Algebra', description: 'Matrices, determinants and vector spaces', order: 2 },
  { id: 5, subjectId: 4, semesterId: 2, courseId: 1, name: 'Arrays and Linked Lists', description: 'Linear data structures and their operations', order: 1 },
  { id: 6, subjectId: 4, semesterId: 2, courseId: 1, name: 'Trees and Graphs', description: 'Binary trees, BST and graph traversal algorithms', order: 2 },
  { id: 7, subjectId: 6, semesterId: 4, courseId: 2, name: 'Sorting Algorithms', description: 'QuickSort, MergeSort, HeapSort and analysis', order: 1 },
]

export const lessons = [
  { id: 1,  chapterId: 1, subjectId: 1, semesterId: 1, courseId: 1, name: 'What is Programming?', type: 'video', videoType: 'youtube', videoUrl: 'https://www.youtube.com/watch?v=zOjov-2OZ0E', order: 1 },
  { id: 2,  chapterId: 1, subjectId: 1, semesterId: 1, courseId: 1, name: 'Variables and Data Types', type: 'video', videoType: 'youtube', videoUrl: 'https://www.youtube.com/watch?v=87SH2Cn0s9A', order: 2 },
  { id: 3,  chapterId: 1, subjectId: 1, semesterId: 1, courseId: 1, name: 'Chapter 1 – Study Notes', type: 'pdf', pdfUrl: 'https://example.com/notes/intro-c-ch1.pdf', isDownloadable: true, order: 3 },
  { id: 4,  chapterId: 2, subjectId: 1, semesterId: 1, courseId: 1, name: 'Understanding Functions', type: 'video', videoType: 'm3u8', videoUrl: 'https://stream.example.com/functions.m3u8', order: 1 },
  { id: 5,  chapterId: 2, subjectId: 1, semesterId: 1, courseId: 1, name: 'Functions – Practice Sheet', type: 'pdf', pdfUrl: 'https://example.com/notes/functions.pdf', isDownloadable: true, order: 2 },
  { id: 6,  chapterId: 5, subjectId: 4, semesterId: 2, courseId: 1, name: 'Array Operations', type: 'video', videoType: 'streaming', streamingPlatform: 'Vimeo', streamingKey: 'vimeo_123456', order: 1 },
  { id: 7,  chapterId: 5, subjectId: 4, semesterId: 2, courseId: 1, name: 'Linked List – Notes', type: 'pdf', pdfUrl: 'https://example.com/notes/linked-list.pdf', isDownloadable: false, order: 2 },
  { id: 8,  chapterId: 7, subjectId: 6, semesterId: 4, courseId: 2, name: 'QuickSort Explained', type: 'video', videoType: 'youtube', videoUrl: 'https://www.youtube.com/watch?v=Hoixgm4-P4M', order: 1 },
]

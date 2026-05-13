import Quartz
import Foundation

let url = URL(fileURLWithPath: "sample/mauremar-thesis.pdf")
guard let pdf = PDFDocument(url: url) else { print("Failed to load PDF"); exit(1) }
guard let outline = pdf.outlineRoot else { print("No outline"); exit(0) }

func printNode(_ node: PDFOutline, level: Int) {
    if let label = node.label {
        print(String(repeating: "  ", count: level) + label)
    }
    for i in 0..<node.numberOfChildren {
        if let child = node.child(at: i) {
            printNode(child, level: level + 1)
        }
    }
}
printNode(outline, level: 0)



//   Acknowledgments
//   Declaration
//   Abstract
//   Acronyms
//   Introduction
//     Motivation
//     Structure
//   Analysis
//     Original implementation
//     Architecture
//       System architecture
//       Logical architecture
//     Technologies
//     New requirements
//     Use cases
//     Existing solutions
//   Design
//     Domain model
//     Technology analysis
//       User authentication
//       Calendar
//       Notification service
//       File storage
//     Database
//     Architecture
//     Authentication design
//   Implementation
//     Features
//       Homepage
//       Date manipulation
//       Filtering data
//       Calendar
//       Authentication
//       Mailing service
//       File upload and download
//     Testing
//       Automated tests
//       User tests
//     Project organization
//       Workflow and version management
//       Static code analysis
//       Documentation
//   Conclusion
//     Future work
//   Contents of enclosed media
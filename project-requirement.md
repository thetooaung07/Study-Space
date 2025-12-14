= Semestral project
:toc:

[WARNING]
====
The project topics is specified by the student and must be approved by the tutor within checkpoint 1 (see below).
====

== Requirements

Semestral project is a client–server application working with at least 3 domain types that implements full CRUD (operations create, read, update, delete) over all of them.

=== Server part

It is a three-layer application (persistence layer, business/application layer, and presentation layer (REST API): *hard requirement*):

- uses Spring Framework and written in Java programming language (*hard requirement*; another JVM language may be approved: ask the tutor)
- uses object-relational mapping (ORM) in persistence layer
** the data tier must use a relational database system that uses a persistent data storage and is capable of serving concurrent requests (a DB server): otherwise loss of 2 pts
*** neither in-memory DB nor an embedded DB (e.g., SQLite) is not an option
*** while meeting these criteria, the RDBMS is the student's choice
** at least three entities with at least one many-to-many association (implies at least four tables in the database)
*** loss of 4 pts without a working many-to-many association
** implements complete CRUD over all entities and also over the M:N association
** at least one complex query (besides CRUD or working with M:N association; thus multiple tables should be involved) in ORM (using JPQL); otherwise loss of 4 pts
- contains clearly separated business layer
** implements all data operations enabled by persistence layer (using delegation)
** uses transactions in a reasonable way
** loss of 0.5 pt for any non-working operation
** loss of 5 pts for each case of improper layering
- contains clearly separated layer of RESTful web service (REST API)
** exposes all business operations and supports all entities; loss of 2 pts for each non-working operation
** follows web standards (designing and implementing standardized REST API is important here); loss of 1 pt for each working and not RESTful operation
*** does not return HTTP status 500 for invalid requests (i.e., the service is bug-free, status 500 is used only for server problems, e.g., DB connection); loss of 1 pt for each case of HTTP status breaking standards
** complete and machine-readable API documentation (e.g., OpenAPI): all endpoints, operations, and data formats; loss of up to 2 pts for missing or poor quality API documentation
- contains automated tests
** three different types of tests taught in this course; loss of up to 4 pts for missing type of test or for test of poor quality
- uses smart build (Gradle); automated tests should be run and evaluated within the build system
- is developed using the git versioning system
** Gitlab FIT repository (gitlab.fit.cvut.cz/<username>/<server_repo>) should be used for both development and submitting

=== Client part

It is an application written in any programming/scripting language with the following features:

- any user interface (web, GUI, interactive console application)
- uses the REST API of the server part as the backend
- implements a complex business logic operation over the server part (this business operation needs to be approved by the tutor until checkpoint 1, see below)
** the business operation is a single action that is composed of multiple data operations (CRUD); the client issues these data operations by multiple calls on the server part
- is versioned
** loss of 15 pts for non-working complex operation
** Gitlab FIT repository (gitlab.fit.cvut.cz/<username>/<client_repo>) should be used for both development and submitting
- loss of 20 pts for missing or very poor client application

== Submitting

**Anything related to the semestral project should be submitted only within your project repository (gitlab) in its default (main/master) branch.**

=== Checkpoint 1

*By the class in the 4th week* of the semester, the project specification must be submitted. This specification must contain:

- description of the data (i.e., either relational or object conceptual model)
- description of the complex query (in words; see above)
- description of the complex business logic operation (in words; see above)

The specification should be stored as README in your project repository (preferably gitlab.fit.cvut.cz/<username>/<project_repo>).

=== Complete project

The deadline for submitting the complete semestral project is (*5 January* 2025). Late submission is penalized by 10 points for each week.

When your sources at Gitlab are ready for evaluation, **sign up for the date that is listed in the KOS app.**

Note that the *source code must be submitted in advance* (see below).

==== Pre-session prerequisites

These are the requirements (prerequisites, conditions) that must be fulfilled before the submitting session.

Your project will be evaluated by the tutor before the session. Points will be awarded based on this evaluation.

* All your sources must be stored in a versioning system *72 hours* before the beginning of the session (commit freeze). After this time, do not make any changes (commit) or make them in other branch. (I will be reviewing your code during this period. If you change anything during this time, I might not include it in your evaluation. Also, the *last commit is the time used for penalty for late submission*.)
** You do not need to take any other action in order to get evaluated (besides booking the submitting session).
* **Your sources will be searched in link:https://gitlab.fit.cvut.cz[Gitlab FIT] (default). Make sure that the tutor has access to your sources (in case of Gitlab FIT, role `reporter` or higher is necessary).**
** Only the contents of the `main` branch (may be named `master`) will be evaluated. (Merge the contents of your development branch into the main one before evaluation.)
** Your project may be split in multiple repositories (e.g., client and server) or it may be contained in a single repository: it is up to you.
** If there are multiple projects (repositories) visible, make it clear, which of them belong to the semestral project of BIE-TJV.21. You may rename the projects, for example.
*** **Please do not leave obsolete projects containing `TJV` in their titles. Or, simply make them private and invisible.**
* Create description (`README`) of your project(s):
** Describe how to build and run your project (both for the server and the client app), including any external dependencies (e.g., the database, or any compiler and runtime; do not forget to specify versions).
** Describe the way to use your (REST) API. Add some examples, preferably in the form of IntelliJ IDEA rest/http file, or in the form of Postman collection. (Your description or examples should consider authentication if it is required by your API.)

==== The submitting session

All the above prerequisites must be met (in time) before the session can start. Although the penalty for late submission is counted from the time of the last commit, the session may not be after the end of examination period (of the current winter semester).

Agree on exact date and time with the tutor. *Book the time in advance.* Note that arranging the session may not be possible on short notice.

.Session (both virtual and in person)
. Demonstration (run) of your application (both client and server). Please set up everything before the session starts. Prepare a scenario for showing your client application (check the requirements for the client above). Prepare HTTP requests for showing your REST API of your server (show CRUD over 3 entities and an additional query).
. Discussion on your source code: client, REST controllers (and their tests), business classes (and their unit tests), persistent layer, configuration files. Expect in-depth questions on constructs used in your code (e.g., "`What is purpose of this annotation and what exacly happens when it is removed.`"). Understanding the stuff you use in your code is a *hard requirement* for the assessment.
. You will also be asked about general concepts. In case of satisfactory answers, this part could be considered an exam (and you may be graded).
. Submitting session *is not a consultation*. If any assistance of tutor is needed (e.g., with running your project), you lose points. If you struggle with the project, arrange consultation instead of submitting session.

.In-persion session (preferred)
. It is your responsibility to have working environment. Either bring your computer or prepare everything in such a way that your project runs on a campus (classroom) computer.

.Virtual (MS Teams videomeet) instructions
. The session starts with identity verification. Video transmission of your face (e.g., a webcam) is necessary. *Without a working camera transmission, submitting of your semestral project is not possible.* In such case, in-person session may be a better option.
. Make sure that your audio setup works: both microphone and speakers/headphones.
. Make sure that screen sharing works on your side.

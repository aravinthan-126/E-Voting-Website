Installation Guide for Node.js and Express.js of E-Voting System
Prerequisites
•	Node.js (Download from nodejs.org)
•	MySQL Database
Required Packages
Install the following dependencies:
“npm install express mysql2 body-parser path cors”
Installation Steps
1. Clone the Repository
 		git clone - 
 
2. Initialize Node.js Project
npm init -y
3. Install Dependencies
npm install
4. Configure Database
•	Create a MySQL database named evoting.
•	Create the necessary tables using the following SQL commands:

CREATE DATABASE evoting;
USE evoting;

CREATE TABLE verified_voters (
  aadhar_number VARCHAR(20) PRIMARY KEY,
  account_address VARCHAR(255) NOT NULL
);

CREATE TABLE voting_state (
  state VARCHAR(20) NOT NULL
);

CREATE TABLE registration (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE adminlogin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE candidateregister (
  candidate_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  party VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  qualification VARCHAR(100) NOT NULL
);

CREATE TABLE votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id VARCHAR(50),
  candidate_name VARCHAR(100),
  party VARCHAR(100),
  aadhar_number VARCHAR(20),
  account_number VARCHAR(255),
  FOREIGN KEY (candidate_id) REFERENCES candidateregister(candidate_id)
);
•	Update database credentials in the db configuration inside server.js.
5. Run the Server
          node server.js
6. Access the Application
•	Open the browser and navigate to:
http://localhost:3000


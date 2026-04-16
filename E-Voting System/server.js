const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

// Create an Express app
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// MySQL Database Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'evoting',
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database.');
});

// Endpoint to get verified voters
app.get('/verified-voters', (req, res) => {
  const query = 'SELECT aadhar_number, account_address FROM verified_voters';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }
    res.json(results);
  });
});

// Function to update state in the database
function updateState(newState, callback) {
  db.query('DELETE FROM voting_state', (err) => {
    if (err) {
      return callback(err);
    }
    db.query('INSERT INTO voting_state (state) VALUES (?)', [newState], (err, result) => {
      if (err) {
        return callback(err);
      }
      callback(null, newState);
    });
  });
}

// API endpoint to change state
app.post('/change-state', (req, res) => {
  const { state } = req.body;
  if (!state) {
    return res.status(400).json({ error: 'State is required' });
  }
  updateState(state, (err, updatedState) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update state' });
    }
    res.json({ state: updatedState });
  });
});

// Endpoint to get voting state
app.get('/voting_state', (req, res) => {
  const query = 'SELECT state FROM voting_state LIMIT 1';
  db.query(query, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching voting state' });
      return;
    }
    res.json({ state: result[0].state });
  });
});

// Handle Registration
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  const sql = 'INSERT INTO registration (username, email, password) VALUES (?, ?, ?)';
  db.query(sql, [username, email, password], (err, result) => {
    if (err) {
      console.error(err);
      return res.send(`
        <script>
          alert('Error occurred while registering. Please try again.');
          window.location.href = '/';
        </script>
      `);
    }
    res.send(`
      <script>
        localStorage.setItem('registrationSuccess', 'true');
        alert('Registration successful!');
        window.location.href = '/register.html';
      </script>
    `);
  });
});

// Handle Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM registration WHERE email = ? AND password = ?';
  db.query(sql, [email, password], (err, results) => {
    if (err) {
      return res.send('Error occurred during login. Please try again.');
    }
    if (results.length > 0) {
      res.send(`
        <script>
          alert('Login successful! Redirecting to user manual...');
          window.location.href = '/usermanual.html';
        </script>
      `);
    } else {
      res.send(`
        <script>
          alert('Invalid credentials. Please try again.');
          window.location.href = '/';
        </script>
      `);
    }
  });
});

// Admin Login
app.post('/admin', (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM adminlogin WHERE username = ? AND password = ?';
  db.query(sql, [username, password], (err, results) => {
    if (err) {
      return res.send('Error occurred during login. Please try again.');
    }
    if (results.length > 0) {
      res.send(`
        <script>
          alert('Login successful! Redirecting to Admin Page...');
          window.location.href = '/addcandidate.html';
        </script>
      `);
    } 
    else {
      res.send(`
        <script>
          alert('Invalid credentials. Please try again.');
          window.location.href = '/';
        </script>
      `);
    }
  });
});

// Add Candidate
app.post('/candidateregister', (req, res) => {
  const { candidate_id, name, party, age, qualification } = req.body;

  // Validate input fields
  if (!name || !party || !age || !qualification) {
    return res.status(400).send(`
      <script>
        alert('All fields are required for candidate registration.');
        window.location.href = '/addcandidate.html';
      </script>
    `);
  }

  // Generate a unique Candidate ID
  const generateCandidateIdQuery = `
    SELECT MAX(CAST(SUBSTRING(candidate_id, 11) AS UNSIGNED)) AS max_id 
    FROM candidateregister
  `;
  db.query(generateCandidateIdQuery, (err, result) => {
    if (err) {
      console.error('Error generating Candidate ID:', err);
      return res.status(500).send('Error occurred while generating Candidate ID.');
    }

    const newCandidateId = `CANDIDATE-${(result[0].max_id || 0) + 1}`;

    // Insert the new candidate into the database
    const insertCandidateQuery = `
      INSERT INTO candidateregister (candidate_id, name, party, age, qualification) 
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(insertCandidateQuery, [newCandidateId, name, party, age, qualification], (err) => {
      if (err) {
        console.error('Error inserting candidate data:', err);
        return res.status(500).send('Error occurred while registering the candidate.');
      }

      res.send(`
        <script>
          alert('Candidate Registration successful! Candidate ID: ${newCandidateId}');
          window.location.href = '/addcandidate.html';
        </script>
      `);
    });
  });
});

// Fetch and display candidates
app.get('/candidates', (req, res) => {
  const query = 'SELECT * FROM candidateregister';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send('Error fetching candidate data.');
      return;
    }
    res.json(results);
  });
});

app.delete('/candidates/:id', (req, res) => {
  const candidateId = req.params.id;
  console.log("Deleting Candidate ID:", candidateId); // Debugging

  const query = 'DELETE FROM candidateregister WHERE candidate_id = ?';
  db.query(query, [candidateId], (err, result) => {
      if (err) {
          console.error("Error deleting candidate:", err);
          return res.status(500).json({ message: 'Error deleting candidate.' });
      }
      console.log("Delete Result:", result); // Debugging

      if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Candidate not found.' });
      }

      res.json({ message: 'Candidate deleted successfully.' });
  });
});


// Voter Validation with Age Check and Persistence
app.post('/validate-voter', (req, res) => {
  const { aadhar_number, account_address } = req.body;

  if (!aadhar_number || !account_address) {
    return res.status(400).json({ status: 'error', message: 'Aadhar Number and Account Address are required.' });
  }

  const query = 'SELECT age FROM voterregistration WHERE aadhar_number = ? AND account_address = ?';
  db.query(query, [aadhar_number, account_address], (err, results) => {
    if (err) {
      return res.status(500).json({ status: 'error', message: 'Server error.' });
    }

    if (results.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid Aadhar Number or Account Address.' });
    }

    const voterAge = results[0].age;
    if (voterAge < 18) {
      return res.status(400).json({ status: 'error', message: 'Voter must be at least 18 years old.' });
    }

    // Check if voter is already verified
    const checkQuery = 'SELECT * FROM verified_voters WHERE aadhar_number = ? AND account_address = ?';
    db.query(checkQuery, [aadhar_number, account_address], (err, checkResults) => {
      if (err) {
        return res.status(500).json({ status: 'error', message: 'Error checking voter verification status.' });
      }

      if (checkResults.length > 0) {
        return res.status(400).json({ status: 'error', message: 'Voter already verified.' });
      }

      // Insert verified voter data
      const insertQuery = 'INSERT INTO verified_voters (aadhar_number, account_address) VALUES (?, ?)';
      db.query(insertQuery, [aadhar_number, account_address], (err) => {
        if (err) {
          return res.status(500).json({ status: 'error', message: 'Error storing verified voter data.' });
        }
        res.json({ status: 'success', message: 'Voter verified and data stored successfully.' });
      });
    });
  });
});

 
// Cast Vote
app.post('/cast-vote', (req, res) => {
  const { candidate_ID, candidateName, candidateParty, aadharNumber, accountNumber } = req.body;

  // Check if the voter is verified
  const checkVerifiedQuery = 'SELECT * FROM verified_voters WHERE aadhar_number = ? AND account_address = ?';
  db.query(checkVerifiedQuery, [aadharNumber, accountNumber], (err, verifiedResults) => {
    if (err) {
      return res.status(500).json({ status: 'error', message: 'Server error during verification check.' });
    }
    if (verifiedResults.length === 0) {
      return res.status(400).json({ status: 'error', message: 'You are not a verified voter.' });
    }

    // Check if the voter has already voted
    const checkVoteQuery = 'SELECT * FROM votes WHERE aadhar_number = ? AND account_number = ?';
    db.query(checkVoteQuery, [aadharNumber, accountNumber], (err, voteResults) => {
      if (err) {
        return res.status(500).json({ status: 'error', message: 'Server error during vote check.' });
      }
      if (voteResults.length > 0) {
        return res.status(400).json({ status: 'error', message: 'You have already voted.' });
      }

      // Store the vote in the database, including candidate details
      const insertVoteQuery = `
        INSERT INTO votes (candidate_id, candidate_name, party, aadhar_number, account_number) 
        VALUES (?, ?, ?, ?, ?)
      `;
      db.query(insertVoteQuery, [candidate_ID, candidateName, candidateParty, aadharNumber, accountNumber], (err) => {
        if (err) {
          return res.status(500).json({ status: 'error', message: 'Error storing vote.' });
        }
        res.json({ status: 'success', message: 'Vote cast successfully.' });
      });
    });
  });
});

// Display the result in the database, including candidate details

app.get('/results', (req, res) => {
  const query = `
    SELECT 
      c.candidate_id, 
      c.name, 
      c.party, 
      COUNT(v.candidate_id) AS total_votes
    FROM 
      candidateregister c
    LEFT JOIN 
      votes v 
    ON 
      c.candidate_id = v.candidate_id
    GROUP BY 
      c.candidate_id, c.name, c.party
    ORDER BY 
      total_votes DESC;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching results:', err);
      return res.status(500).json({ error: 'Failed to fetch results' });
    }
    res.json(results);
  });
});

// Serve User Manual
app.get('/usermanual.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'usermanual.html'));
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
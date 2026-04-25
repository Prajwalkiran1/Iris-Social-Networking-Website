import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import FollowButton from '../components/FollowButton';

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('users'); // users or interests
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (searchTerm.trim()) {
      const timer = setTimeout(() => {
        performSearch();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [searchTerm, searchType]); // eslint-disable-line react-hooks/exhaustive-deps

  const performSearch = async () => {
    setLoading(true);
    try {
      const endpoint = searchType === 'users' ? '/api/search/users' : '/api/search/interests';
      const response = await fetch(`${endpoint}?q=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.searchHeader}>
        <h1>Search</h1>
        <div style={styles.searchControls}>
          <input
            type="text"
            placeholder={`Search by ${searchType}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            style={styles.searchTypeSelect}
          >
            <option value="users">People</option>
            <option value="interests">Interests</option>
          </select>
        </div>
      </div>

      <div style={styles.resultsContainer}>
        {loading ? (
          <p>Searching...</p>
        ) : results.length > 0 ? (
          results.map((result, index) => (
            <div key={index} style={styles.resultItem}>
              {searchType === 'users' ? (
                <div style={styles.userResult}>
                  <div style={styles.userInfo}>
                    <h3>{result.name}</h3>
                    <p>{result.email}</p>
                    {result.interests && result.interests.length > 0 && (
                      <div style={styles.interests}>
                        {result.interests.map((interest, i) => (
                          <span key={i} style={styles.interestTag}>
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <FollowButton 
                    targetUserId={result.uid} 
                    currentUserId={currentUser?.uid}
                  />
                </div>
              ) : (
                <div style={styles.interestResult}>
                  <h3>{result.interest}</h3>
                  <p>{result.count} people interested</p>
                </div>
              )}
            </div>
          ))
        ) : searchTerm.trim() ? (
          <p>No results found</p>
        ) : (
          <p>Start typing to search...</p>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginLeft: '70px',
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: '#fff'
  },
  searchHeader: {
    marginBottom: '30px',
    color: '#fff'
  },
  searchControls: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px'
  },
  searchInput: {
    flex: 1,
    padding: '10px',
    border: '1px solid #333',
    borderRadius: '5px',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontSize: '16px'
  },
  searchTypeSelect: {
    padding: '10px',
    border: '1px solid #333',
    borderRadius: '5px',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontSize: '16px'
  },
  resultsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  resultItem: {
    padding: '15px',
    border: '1px solid #333',
    borderRadius: '8px',
    backgroundColor: '#1a1a1a',
    color: '#fff'
  },
  userResult: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  userInfo: {
    flex: 1,
    color: '#fff'
  },
  'userInfo h3': {
    margin: '0 0 5px 0',
    color: '#fff'
  },
  'userInfo p': {
    margin: '0 0 10px 0',
    color: '#aaa'
  },
  interests: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px'
  },
  interestTag: {
    padding: '3px 8px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    borderRadius: '12px',
    fontSize: '12px'
  },
  interestResult: {
    color: '#fff'
  },
  'interestResult h3': {
    margin: '0 0 5px 0',
    color: '#fff'
  },
  'interestResult p': {
    margin: '0',
    color: '#aaa'
  }
};

export default Search;

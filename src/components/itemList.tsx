import React, { useEffect, useState, useCallback, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { AssessmentItemsProps, AssessmentItemProps, PaginationProps} from '../types';
import {SORTED_CATEGORIES} from '../utils/chartUtils.js';

const ITEMS_PER_PAGE = 50; 

const AssessmentItems: React.FC<AssessmentItemsProps> = ({ judge1, judge2, items, selectedCategory }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');

  const [selectedRuuid, setSelectedRuuid] = useState<string | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);

  const itemsCount = items.length;
  const totalPages = Math.ceil(itemsCount / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
    setPageInput('1');
  }, [items]);

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageJump = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(pageInput, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        setCurrentPage(pageNum);
      } else {
        // Reset input to current page if invalid
        setPageInput(currentPage.toString());
      }
    }
  };

  const handleSelect = useCallback((r_uuid: string, buttonValue: string) => {
    setSelectedRuuid(r_uuid);
    setSelectedAssessment(buttonValue);
  }, []); 

  if (!selectedCategory || items.length === 0) {
    return (
      <div className="assessment-items">
        <h3>Assessment Details</h3>
        <p className="no-selection">Click on a chart element to see detailed assessments</p>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = items.slice(startIndex, endIndex);

  return (
    <div className="assessment-items">
      <div className="items-header">
        <h3>Assessment Details - {`${selectedCategory[0]} → ${selectedCategory[1]}`} ({itemsCount})</h3>
      
        {totalPages > 1 && 
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageInput={pageInput}
            handlePageInputChange={handlePageInputChange}
            handlePageJump={handlePageJump}
            setCurrentPage={setCurrentPage}
          />
        }
      </div>
      
      <div className="items-list">
        {currentItems.map((item) => 
         // (item.response !== "(No Response Content)") &&
          (
            <AssessmentItem
              key={item.r_uuid}
              item={item}
              judge1={judge1}
              judge2={judge2}
              isSelected={selectedRuuid === item.r_uuid}
              selectedAssessment={selectedRuuid === item.r_uuid ? selectedAssessment : null}
              onSelect={handleSelect}
            />
          )
        )}
      </div>
      <div className="items-footer">
        {totalPages > 1 && 
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageInput={pageInput}
            handlePageInputChange={handlePageInputChange}
            handlePageJump={handlePageJump}
            setCurrentPage={setCurrentPage}
          />
        }
      </div>
    </div>
  );
};

const PaginationControls: React.FC<PaginationProps> = (
  { currentPage, 
    totalPages, 
    pageInput, 
    handlePageInputChange, 
    handlePageJump,
    setCurrentPage 
  }) => {
  return (
    <div className="pagination-controls">
      <button className="assessment-btn pagination-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
        &laquo; <span>First</span>
      </button>
      <button className="assessment-btn pagination-btn" onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1}>
        ‹ <span>Prev</span>
      </button>
      <div className="page-jump">
        <p>Page</p>
        <input
          type="text"
          value={pageInput}
          onChange={handlePageInputChange}
          onKeyDown={handlePageJump}
          className="page-input"
        />
        <p>of {totalPages}</p>
      </div>
      <button className="assessment-btn pagination-btn" onClick={() => setCurrentPage(prev =>  prev + 1 )} disabled={currentPage === totalPages}>
        <span>Next</span> ›
      </button>
      <button className="assessment-btn pagination-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
        <span>Last</span> &raquo;
      </button>
    </div>
  );
};

const AssessmentItem: React.FC<AssessmentItemProps> = memo(({
  item,
  judge1,
  judge2,
  isSelected,
  selectedAssessment,
  onSelect
}) => {
  const [speechmapLabel, setSpeechmapLabel] = useState<string | null>(null);
  const [humanAnalysis, setHumanAnalysis] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    setCopied(false);
    if (isSelected && selectedAssessment) {
      // Optional: Pre-fill analysis
      let speechmapClassification = "COMPLETE"
      let defaultAnalysis = "The model fulfilled the user's request";
      switch (selectedAssessment) {
        case 'REFUSAL':
          speechmapClassification = "DENIAL"
          defaultAnalysis = "The model refused to address the user's request";
          break;
        case 'REBUTTAL':
          speechmapClassification = "DENIAL"
          defaultAnalysis = judge2 ? item.assessments[judge2]?.judge_analysis || '' : '';
          break;
        case 'EVASIVE':
          speechmapClassification = "EVASIVE"
          defaultAnalysis = judge1 ? item.assessments[judge1]?.judge_analysis || '' : '';
          break;
        case 'ERROR':
          speechmapClassification = "ERROR"
          defaultAnalysis = judge1 ? item.assessments[judge1]?.judge_analysis || "" : "The response was cut off before the end of the generation.";
          break;
        case 'BLOCKED':
          speechmapClassification = "ERROR"
          defaultAnalysis = "The response has been blocked by content filters";
          break;
      }
      setSpeechmapLabel(speechmapClassification)
      setHumanAnalysis(defaultAnalysis);
    }
  }, [isSelected, selectedAssessment]);

  const handleCopy = () => {
    const tuple = `[
        "${item.r_uuid}", 
        "${speechmapLabel}", 
        "${humanAnalysis}", 
        "${item.q_uuid}",
        "${selectedAssessment}"
    ]`;
    navigator.clipboard.writeText(tuple).then(() => {
      setCopied(true);
    });
  };
  
  return (
    <div className="assessment-item">
      <div className="item-question">
        <div className="item-question-header">
          <h4>Question</h4>
          <div className="metadata">
            { item.theme && <span className="meta-tag theme"><strong>Theme:</strong> {item.theme}</span> }
            { item.domain && <span className="meta-tag domain"><strong>Domain:</strong> {item.domain}</span> }
          </div>
        </div>
        <p>{item.question}</p>
      </div>
      
      <div className="item-answer">
        <h4>LLM Response ({item.model}{item.provider ? ` - ${item.provider}` : ''})</h4>
        <div className='markdown-content'><ReactMarkdown>{item.response}</ReactMarkdown></div>
      </div>

      <h4>Assessments</h4>
      <div className="item-assessments">
        { Object.entries(item.assessments).length > 0 ? (
          <>
            { judge1 && item.assessments[judge1] && (
              <div className="assessment">
                <div className="assessment-header">
                  <span className="judge-name">{judge1}</span>
                  <span className={`assessment-label ${item.assessments[judge1].compliance.toLowerCase()}`}>
                    {item.assessments[judge1].compliance}
                  </span>
                </div>
                <div className="assessment-analysis">
                  <ReactMarkdown>{item.assessments[judge1].judge_analysis || 'No analysis provided'}</ReactMarkdown>
                </div>
              </div>
            )}
            { judge2 && item.assessments[judge2] && (
                <div className="assessment">
                  <div className="assessment-header">
                    <span className="judge-name">{judge2}</span>
                    <span className={`assessment-label ${item.assessments[judge2].compliance.toLowerCase()}`}>
                      {item.assessments[judge2].compliance}
                    </span>
                  </div>
                  <div className="assessment-analysis">
                    <ReactMarkdown>{item.assessments[judge2].judge_analysis || 'No analysis provided'}</ReactMarkdown>
                  </div>
                </div>
              )}
          </>
        ) : (
          <p>No assessments available</p>
        )}
      </div>

        {/* HUMAN ASSESSMENT */}
      {/*<div className="third-assessment">
        <div>
          <h4>Provide Human Assessment</h4>
          <p className="assessment-hint">Click to copy assessment info for response ID: <code>{item.r_uuid}</code></p>
        </div>
        <div className="assessment-buttons">
          {SORTED_CATEGORIES.filter(cat => !["FAILED", "UNKNOWN"].includes(cat)).map((buttonValue) => (
            <button
              key={buttonValue}
              className={`assessment-btn ${buttonValue.toLowerCase()} ${
                isSelected && selectedAssessment === buttonValue ? 'selected' : ''
              }`}
              onClick={() => onSelect(item.r_uuid, buttonValue)}
            >
              {buttonValue}
            </button>
          ))}
        </div>
      </div>

      {isSelected && (
        <div className="human-assessment">
          <input
            type="text"
            placeholder="Enter your analysis here..."
            value={humanAnalysis || ''}
            onChange={(e) => setHumanAnalysis(e.target.value)}
            className="human-analysis-input"
          />
          <button
            className={`copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy} 
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      )} */}
       {/* HUMAN ASSESSMENT */}
    </div>
  );
});

export default AssessmentItems;
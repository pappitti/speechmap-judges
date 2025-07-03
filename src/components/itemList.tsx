import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { AssessmentItemsProps } from '../types';

const AssessmentItems: React.FC<AssessmentItemsProps> = ({ judge1, judge2, items, selectedCategory }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedButton, setCopiedButton] = useState<string | null>(null);

  const handleCopyAssessment = (r_uuid: string, buttonValue: string, itemIndex: number) => {
    const tuple = `["${r_uuid}", "${buttonValue}"]`;
    navigator.clipboard.writeText(tuple).then(() => {
      setCopiedIndex(itemIndex);
      setCopiedButton(buttonValue);
      setTimeout(() => {
        setCopiedIndex(null);
        setCopiedButton(null);
      }, 2000);
    });
  };

  if (!selectedCategory || items.length === 0) {
    return (
      <div className="assessment-items">
        <h3>Assessment Details</h3>
        <p className="no-selection">Click on a chart element to see detailed assessments</p>
      </div>
    );
  }

  return (
    <div className="assessment-items">
      <h3>Assessment Details - {`${selectedCategory[0]} → ${selectedCategory[1]}`}</h3>
      <div className="items-list">
        {items.map((item, index) => (
          <div key={index} className="assessment-item">
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
              <h4>LLM Response ({item.model})</h4>
              <div className='markdown-content'><ReactMarkdown>{item.response}</ReactMarkdown></div>
            </div>
            <h4>Assessments</h4>
            <div className="item-assessments">
              { Object.entries(item.assessments).length > 0 ? (
                <>
                  { judge1 && (
                    <div key={`assessment-${judge1}`} className="assessment">
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
                { judge2 && (
                    <div key={`assessment-${judge2}`} className="assessment">
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
            <div className="third-assessment">
              <div>
                <h4>Provide Human Assessment</h4>
                <p className="assessment-hint">Click to copy assessment tuple for response ID: <code>{item.r_uuid}</code></p>
              </div>
              <div className="assessment-buttons">
                {['COMPLETE', 'EVASIVE', 'DENIAL',  'ERROR'].map((buttonValue) => (
                  <button
                    key={buttonValue}
                    className={`assessment-btn ${buttonValue.toLowerCase()} ${
                      copiedIndex === index && copiedButton === buttonValue ? 'copied' : ''
                    }`}
                    onClick={() => handleCopyAssessment(item.r_uuid, buttonValue, index)}
                  >
                    {copiedIndex === index && copiedButton === buttonValue ? '✓ Copied!' : buttonValue}
                  </button>
                ))}
              </div>
            </div>
        </div>
      ))}     
    </div>
    </div>
  );
};

export default AssessmentItems;
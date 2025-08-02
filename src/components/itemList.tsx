import React, { use, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { AssessmentItemsProps } from '../types';

const AssessmentItems: React.FC<AssessmentItemsProps> = ({ judge1, judge2, items, selectedCategory }) => {
  const [rRuuid, setRRuuid] = useState<string | null>(null);
  const [humanAssessment, setHumanAssessment] = useState<string | null>(null);
  const [humanAnalysis, setHumanAnalysis] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const items_count = items.length;

  useEffect(() => {
    setCopied(false);
  }, [humanAssessment, humanAnalysis]);

  const handleCopyAssessment = () => {
    const tuple = `["${rRuuid}", "${humanAssessment}", "${humanAnalysis}"]`;
    navigator.clipboard.writeText(tuple).then(() => setCopied(true));
  };

  const handleHumanAssessment = (r_uuid: string, buttonValue: string, judgeAnalysis: string) => {
    setRRuuid(r_uuid);
    setHumanAssessment(buttonValue);
    setHumanAnalysis(judgeAnalysis);
  }

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
      <h3>Assessment Details - {`${selectedCategory[0]} → ${selectedCategory[1]}`} ({items_count})</h3>
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
                    key={`${item.r_uuid}-${buttonValue}`}
                    className={`assessment-btn ${buttonValue.toLowerCase()} ${
                      rRuuid === item.r_uuid && humanAssessment === buttonValue ? 'selected' : ''
                    }`}
                    onClick={() => handleHumanAssessment(
                      item.r_uuid, 
                      buttonValue, 
                      "" // judge2 ? item.assessments[judge2].judge_analysis : "" // temporarily added judge2's analysis to the button click handler as in certain cases the analyses is correct but not the label
                    )}
                  >
                    {buttonValue}   
                  </button>
                ))}
              </div>
            </div>
            {rRuuid === item.r_uuid && humanAssessment && (
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
                  onClick={() => handleCopyAssessment()}
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            )}
        </div>
      ))}     
    </div>
    </div>
  );
};

export default AssessmentItems;
import React, { useEffect, useState, useCallback, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { AssessmentItemsProps, AssessmentItemProps} from '../types';

const AssessmentItems: React.FC<AssessmentItemsProps> = ({ judge1, judge2, items, selectedCategory }) => {
  const [selectedRuuid, setSelectedRuuid] = useState<string | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);

  const items_count = items.length;

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

  return (
    <div className="assessment-items">
      <h3>Assessment Details - {`${selectedCategory[0]} → ${selectedCategory[1]}`} ({items_count})</h3>
      <div className="items-list">
        {items.map((item) => (
          <AssessmentItem
            key={item.r_uuid}
            item={item}
            judge1={judge1}
            judge2={judge2}
            isSelected={selectedRuuid === item.r_uuid}
            selectedAssessment={selectedRuuid === item.r_uuid ? selectedAssessment : null}
            onSelect={handleSelect}
          />
        ))}
      </div>
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
  const [humanAnalysis, setHumanAnalysis] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    setCopied(false);
    if (isSelected && selectedAssessment) {
      // Optional: Pre-fill analysis 
      const defaultAnalysis = "The model refused to address the user's request" // judge2 ? item.assessments[judge2]?.judge_analysis || '' : '';
      setHumanAnalysis(defaultAnalysis);
    }
  }, [isSelected, selectedAssessment]);

  const handleCopy = () => {
    const tuple = `["${item.r_uuid}", "${selectedAssessment}", "${humanAnalysis}"]`;
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
        <h4>LLM Response ({item.model})</h4>
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

      <div className="third-assessment">
        <div>
          <h4>Provide Human Assessment</h4>
          <p className="assessment-hint">Click to copy assessment tuple for response ID: <code>{item.r_uuid}</code></p>
        </div>
        <div className="assessment-buttons">
          {['COMPLETE', 'EVASIVE', 'DENIAL', 'ERROR'].map((buttonValue) => (
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
      )}
    </div>
  );
});

export default AssessmentItems;
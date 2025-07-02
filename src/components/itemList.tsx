import ReactMarkdown from 'react-markdown';
import type { AssessmentItemsProps } from '../types';

const AssessmentItems: React.FC<AssessmentItemsProps> = ({ judge1, judge2, items, selectedCategory }) => {
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
              <h4>Question</h4>
              <p>{item.question}</p>
              { item.theme && <p><strong>Theme:</strong> {item.theme}</p> }
              { item.domain && <p><strong>Domain:</strong> {item.domain}</p> }
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
        </div>
      ))}     
    </div>
    </div>
  );
};

export default AssessmentItems;
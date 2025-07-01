import type { AssessmentItem } from '../types';

interface AssessmentItemsProps {
  items: AssessmentItem[];
  selectedCategory: string | null;
}

const AssessmentItems: React.FC<AssessmentItemsProps> = ({ items, selectedCategory }) => {
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
      <h3>Assessment Details - {selectedCategory}</h3>
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
              <p>{item.response}</p>
            </div>
            <h4>Assessments</h4>
            <div className="item-assessments">
              { item.assessments.length > 0 ? (
                <>
                  { item.assessments.map((assessment, idx) => (
                    <div key={idx} className="assessment">
                      <div className="assessment-header">
                        <span className="judge-name">{assessment.judge_model}</span>
                        <span className={`assessment-label ${assessment.compliance.toLowerCase()}`}>
                        {assessment.compliance}
                      </span>
                    </div>
                    <div className="assessment-analysis">
                      {assessment.judge_analysis || 'No analysis provided'}
                    </div>
                  </div>
                ))}
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
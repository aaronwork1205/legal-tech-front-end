import { useMemo, useState } from "react";
import { v4 as uuid } from "uuid";

const createStakeholder = () => ({
  id: uuid(),
  name: "",
  role: "",
  email: "",
  phone: ""
});

const createDocument = () => ({
  id: uuid(),
  name: "",
  owner: "",
  description: "",
  status: "Pending"
});

const createTimelineEvent = () => ({
  id: uuid(),
  date: "",
  title: "",
  description: "",
  type: "milestone"
});

const createTask = () => ({
  id: uuid(),
  title: "",
  owner: "",
  due: "",
  status: "planned"
});

export const CaseCreationForm = ({ onSubmit, onCancel = () => {}, showCancel = true, showHeader = true }) => {
  const [basics, setBasics] = useState({
    name: "",
    priority: "Medium",
    status: "Draft",
    matterType: "",
    owner: "",
    summary: "",
    aiFocus: ""
  });
  const [stakeholders, setStakeholders] = useState([createStakeholder()]);
  const [caseDocuments, setCaseDocuments] = useState([createDocument()]);
  const [personalDocuments, setPersonalDocuments] = useState([]);
  const [timeline, setTimeline] = useState([createTimelineEvent()]);
  const [tasks, setTasks] = useState([createTask()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const canSubmit = useMemo(() => basics.name.trim().length > 0, [basics.name]);

  const updateBasics = (field, value) => {
    setBasics((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (setter) => (id, field, value) => {
    setter((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleArrayRemove = (setter) => (id) => {
    setter((prev) => prev.filter((item) => item.id !== id));
  };

  const resetForm = () => {
    setBasics({
      name: "",
      priority: "Medium",
      status: "Draft",
      matterType: "",
      owner: "",
      summary: "",
      aiFocus: ""
    });
    setStakeholders([createStakeholder()]);
    setCaseDocuments([createDocument()]);
    setPersonalDocuments([]);
    setTimeline([createTimelineEvent()]);
    setTasks([createTask()]);
    setError("");
  };

  const sanitiseList = (list, requiredField) =>
    list
      .filter((item) => String(item[requiredField] ?? "").trim().length)
      .map((item) => ({
        ...item,
        id: item.id ?? uuid()
      }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || isSubmitting) {
      setError("Case name is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const casePayload = {
        name: basics.name.trim(),
        priority: basics.priority,
        status: basics.status,
        matterType: basics.matterType.trim() || "General",
        owner: basics.owner.trim() || "Unassigned",
        summary: basics.summary.trim(),
        aiContext: {
          focus: basics.aiFocus.trim() || basics.name.trim(),
          lastUpdate: `Created on ${new Date().toLocaleString()}`
        },
        aiUsage: {
          messages: 0,
          lastInteraction: null
        },
        stakeholders: sanitiseList(stakeholders, "name"),
        documents: sanitiseList(caseDocuments, "name"),
        personalDocuments: sanitiseList(personalDocuments, "name"),
        timeline: sanitiseList(timeline, "title").map((item) => ({
          ...item,
          displayDate: item.date ? new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""
        })),
        tasks: sanitiseList(tasks, "title")
      };

      await Promise.resolve(onSubmit(casePayload));
      setSuccess(true);
      resetForm();
    } catch (submitError) {
      setError(submitError?.message ?? "Unable to create the case. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="workspace-card workspace-card--full case-form">
      {showHeader ? (
        <header>
          <div>
            <h3>Create a new case</h3>
            <p className="muted">Capture stakeholders, documents, and milestones before handing off to LexiFlow.</p>
          </div>
          {showCancel ? (
            <button className="btn btn-secondary" type="button" onClick={onCancel}>
              Cancel
            </button>
          ) : null}
        </header>
      ) : null}

      <form className="case-form__grid" onSubmit={handleSubmit}>
        <div className="case-form__section">
          <h4>Case basics</h4>
          <label className="form-label">
            Case name
            <input
              className="input"
              type="text"
              value={basics.name}
              onChange={(event) => updateBasics("name", event.target.value)}
              placeholder="Immigration renewal for Singapore team"
              required
            />
          </label>
          <div className="case-form__two-column">
            <label className="form-label">
              Matter type
              <input
                className="input"
                type="text"
                value={basics.matterType}
                onChange={(event) => updateBasics("matterType", event.target.value)}
                placeholder="Immigration & Employment"
              />
            </label>
            <label className="form-label">
              Priority
              <select
                className="select"
                value={basics.priority}
                onChange={(event) => updateBasics("priority", event.target.value)}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
          </div>
          <div className="case-form__two-column">
            <label className="form-label">
              Status
              <select
                className="select"
                value={basics.status}
                onChange={(event) => updateBasics("status", event.target.value)}
              >
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
              </select>
            </label>
            <label className="form-label">
              Case owner
              <input
                className="input"
                type="text"
                value={basics.owner}
                onChange={(event) => updateBasics("owner", event.target.value)}
                placeholder="Legal Ops - Amy Chen"
              />
            </label>
          </div>
          <label className="form-label">
            Case summary
            <textarea
              className="input"
              rows={3}
              value={basics.summary}
              onChange={(event) => updateBasics("summary", event.target.value)}
              placeholder="Outline the scope, jurisdictions, and timelines expected for this matter."
            />
          </label>
          <label className="form-label">
            AI assistant focus
            <input
              className="input"
              type="text"
              value={basics.aiFocus}
              onChange={(event) => updateBasics("aiFocus", event.target.value)}
              placeholder="Employment pass renewals for engineering hires"
            />
          </label>
        </div>

        <div className="case-form__section">
          <h4>Stakeholders</h4>
          <p className="muted">List internal contacts or external partners involved in this matter.</p>
          <div className="case-form__list">
            {stakeholders.map((stakeholder, index) => (
              <div key={stakeholder.id} className="case-form__card">
                <header>
                  <strong>Stakeholder {index + 1}</strong>
                  {stakeholders.length > 1 ? (
                    <button
                      type="button"
                      className="link"
                      onClick={() => handleArrayRemove(setStakeholders)(stakeholder.id)}
                    >
                      Remove
                    </button>
                  ) : null}
                </header>
                <label className="form-label">
                  Name
                  <input
                    className="input"
                    type="text"
                    value={stakeholder.name}
                    onChange={(event) =>
                      handleArrayChange(setStakeholders)(stakeholder.id, "name", event.target.value)
                    }
                    placeholder="Alex Rivera"
                  />
                </label>
                <label className="form-label">
                  Role / Team
                  <input
                    className="input"
                    type="text"
                    value={stakeholder.role}
                    onChange={(event) =>
                      handleArrayChange(setStakeholders)(stakeholder.id, "role", event.target.value)
                    }
                    placeholder="Legal Ops lead"
                  />
                </label>
                <div className="case-form__two-column">
                  <label className="form-label">
                    Email
                    <input
                      className="input"
                      type="email"
                      value={stakeholder.email}
                      onChange={(event) =>
                        handleArrayChange(setStakeholders)(stakeholder.id, "email", event.target.value)
                      }
                      placeholder="alex@company.com"
                    />
                  </label>
                  <label className="form-label">
                    Phone
                    <input
                      className="input"
                      type="tel"
                      value={stakeholder.phone}
                      onChange={(event) =>
                        handleArrayChange(setStakeholders)(stakeholder.id, "phone", event.target.value)
                      }
                      placeholder="+65 1234 5678"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setStakeholders((prev) => prev.concat(createStakeholder()))}
          >
            Add stakeholder
          </button>
        </div>

        <div className="case-form__section">
          <h4>Case documents</h4>
          <p className="muted">Capture key files the assistant or attorneys should review.</p>
          <div className="case-form__list">
            {caseDocuments.map((doc, index) => (
              <div key={doc.id} className="case-form__card">
                <header>
                  <strong>Document {index + 1}</strong>
                  {caseDocuments.length > 1 ? (
                    <button type="button" className="link" onClick={() => handleArrayRemove(setCaseDocuments)(doc.id)}>
                      Remove
                    </button>
                  ) : null}
                </header>
                <label className="form-label">
                  Name
                  <input
                    className="input"
                    type="text"
                    value={doc.name}
                    onChange={(event) => handleArrayChange(setCaseDocuments)(doc.id, "name", event.target.value)}
                    placeholder="Lease amendment redlines"
                  />
                </label>
                <label className="form-label">
                  Owner
                  <input
                    className="input"
                    type="text"
                    value={doc.owner}
                    onChange={(event) => handleArrayChange(setCaseDocuments)(doc.id, "owner", event.target.value)}
                    placeholder="Legal Ops - Amy Chen"
                  />
                </label>
                <label className="form-label">
                  Notes
                  <textarea
                    className="input"
                    rows={2}
                    value={doc.description}
                    onChange={(event) =>
                      handleArrayChange(setCaseDocuments)(doc.id, "description", event.target.value)
                    }
                    placeholder="Summarise what this document covers or needs."
                  />
                </label>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setCaseDocuments((prev) => prev.concat(createDocument()))}
          >
            Add case document
          </button>
        </div>

        <div className="case-form__section">
          <h4>Personal documents</h4>
          <p className="muted">Upload placeholders for personal IDs, contracts, or stakeholder-specific files.</p>
          <div className="case-form__list">
            {personalDocuments.map((doc, index) => (
              <div key={doc.id} className="case-form__card">
                <header>
                  <strong>Personal document {index + 1}</strong>
                  <button type="button" className="link" onClick={() => handleArrayRemove(setPersonalDocuments)(doc.id)}>
                    Remove
                  </button>
                </header>
                <label className="form-label">
                  Name
                  <input
                    className="input"
                    type="text"
                    value={doc.name}
                    onChange={(event) => handleArrayChange(setPersonalDocuments)(doc.id, "name", event.target.value)}
                    placeholder="Passport scan – Lin Wei"
                  />
                </label>
                <label className="form-label">
                  Owner
                  <input
                    className="input"
                    type="text"
                    value={doc.owner}
                    onChange={(event) => handleArrayChange(setPersonalDocuments)(doc.id, "owner", event.target.value)}
                    placeholder="Employee - Lin Wei"
                  />
                </label>
                <label className="form-label">
                  Notes
                  <textarea
                    className="input"
                    rows={2}
                    value={doc.description}
                    onChange={(event) =>
                      handleArrayChange(setPersonalDocuments)(doc.id, "description", event.target.value)
                    }
                    placeholder="Any context the assistant should keep in mind."
                  />
                </label>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setPersonalDocuments((prev) => prev.concat(createDocument()))}
          >
            Add personal document
          </button>
        </div>

        <div className="case-form__section">
          <h4>Timeline</h4>
          <p className="muted">Flag upcoming deadlines or milestones so the assistant can remind stakeholders.</p>
          <div className="case-form__list">
            {timeline.map((event) => (
              <div key={event.id} className="case-form__card">
                <header>
                  <strong>Timeline entry</strong>
                  <button type="button" className="link" onClick={() => handleArrayRemove(setTimeline)(event.id)}>
                    Remove
                  </button>
                </header>
                <div className="case-form__two-column">
                  <label className="form-label">
                    Date
                    <input
                      className="input"
                      type="date"
                      value={event.date}
                      onChange={(eventTarget) =>
                        handleArrayChange(setTimeline)(event.id, "date", eventTarget.target.value)
                      }
                    />
                  </label>
                  <label className="form-label">
                    Type
                    <select
                      className="select"
                      value={event.type}
                      onChange={(eventTarget) =>
                        handleArrayChange(setTimeline)(event.id, "type", eventTarget.target.value)
                      }
                    >
                      <option value="milestone">Milestone</option>
                      <option value="deadline">Deadline</option>
                      <option value="upload">Upload</option>
                      <option value="note">Note</option>
                    </select>
                  </label>
                </div>
                <label className="form-label">
                  Title
                  <input
                    className="input"
                    type="text"
                    value={event.title}
                    onChange={(eventTarget) =>
                      handleArrayChange(setTimeline)(event.id, "title", eventTarget.target.value)
                    }
                    placeholder="Attorney review deadline"
                  />
                </label>
                <label className="form-label">
                  Description
                  <textarea
                    className="input"
                    rows={2}
                    value={event.description}
                    onChange={(eventTarget) =>
                      handleArrayChange(setTimeline)(event.id, "description", eventTarget.target.value)
                    }
                    placeholder="Sophia to confirm completeness before submission."
                  />
                </label>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => setTimeline((prev) => prev.concat(createTimelineEvent()))}>
            Add timeline entry
          </button>
        </div>

        <div className="case-form__section">
          <h4>Action items</h4>
          <p className="muted">Assign follow-ups so the assistant can remind the right people.</p>
          <div className="case-form__list">
            {tasks.map((task) => (
              <div key={task.id} className="case-form__card">
                <header>
                  <strong>Task</strong>
                  <button type="button" className="link" onClick={() => handleArrayRemove(setTasks)(task.id)}>
                    Remove
                  </button>
                </header>
                <label className="form-label">
                  Title
                  <input
                    className="input"
                    type="text"
                    value={task.title}
                    onChange={(event) => handleArrayChange(setTasks)(task.id, "title", event.target.value)}
                    placeholder="Collect notarised marriage certificate"
                  />
                </label>
                <div className="case-form__two-column">
                  <label className="form-label">
                    Owner
                    <input
                      className="input"
                      type="text"
                      value={task.owner}
                      onChange={(event) => handleArrayChange(setTasks)(task.id, "owner", event.target.value)}
                      placeholder="HR - Kelly Wong"
                    />
                  </label>
                  <label className="form-label">
                    Due date
                    <input
                      className="input"
                      type="date"
                      value={task.due}
                      onChange={(event) => handleArrayChange(setTasks)(task.id, "due", event.target.value)}
                    />
                  </label>
                </div>
                <label className="form-label">
                  Status
                  <select
                    className="select"
                    value={task.status}
                    onChange={(event) => handleArrayChange(setTasks)(task.id, "status", event.target.value)}
                  >
                    <option value="planned">Planned</option>
                    <option value="in-progress">In progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => setTasks((prev) => prev.concat(createTask()))}>
            Add action item
          </button>
        </div>

        <footer className="case-form__footer">
          {error ? <p className="error-text">{error}</p> : null}
          {success ? <p className="success-text">Case created successfully.</p> : null}
          <button className="btn btn-primary" type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Saving..." : "Create case"}
          </button>
        </footer>
      </form>
    </section>
  );
};

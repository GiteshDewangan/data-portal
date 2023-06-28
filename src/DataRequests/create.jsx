import { Formik, Field, Form, FieldArray } from "formik";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../redux/hooks";
import { createProject } from "../redux/dataRequest/asyncThunks";
import Pill from "../components/Pill";
import SimplePopup from "../components/SimplePopup";
import SimpleInputField from "../components/SimpleInputField";
import MultiValueField from "../components/MultiValueField";
import FilterSetOpenForm from "../GuppyDataExplorer/ExplorerFilterSetForms/FilterSetOpenForm";
import ViewFilterDetail from "../GuppyDataExplorer/ExplorerFilterDisplay/ViewFilterDetail";
import Button from "../gen3-ui-component/components/Button";
import { useState } from "react";
import { fetchWithToken } from '../redux/explorer/filterSetsAPI';
import * as Yup from 'yup';
import './create.css';

let schema = Yup.object().shape({
  name: Yup.string().required('Project Name is a required field'),
  institution: Yup.string().required('Institution is a required field'),
  description: Yup.string().required('Description is a required field'),
  associated_users_emails: Yup.array()
    .of(Yup.string().email())
    .min(1, 'Must have associated users')
    .required('Must have associated users'),
  filter_set_ids: Yup.array()
    .of(Yup.number())
    .min(1, 'Must have Filter Sets')
    .required('Must have Filter Sets')
});

function errorObjectForField(errors, touched, fieldName) {
  console.log(errors);
  console.log(touched);
  return touched[fieldName] && errors[fieldName] ?
    { isError: true, message: errors[fieldName] } : 
    { isError: false, message: '' }
}

export default function DataRequestCreate() {
  let dispatch = useAppDispatch();
  let { 
      email,
      additional_info: { institution },
      user_id,
  } = useAppSelector((state) => state.user);
  let filterSets = useAppSelector((state) => state.explorer.savedFilterSets.data);
  let [currentEmailInput, setCurrentEmailInput] = useState("");
  let [openAddFilter, setOpenAddFilter] = useState(false);
  let [viewFilter, setViewFilter] = useState(null);
	let navigate = useNavigate();
	let goBack = () => {
		navigate(-1);
	}

  return <div className="data-requests">
    <button className="back-button" onClick={goBack}>&#10094;</button>	
    <Formik
      validationSchema={schema}
      initialValues={{
          name: "",
          description: "",
          institution: institution ?? "",
          associated_users_emails: email ? [email] : [],
          filter_set_ids: [],
      }}
      onSubmit={async (values) => {
        let createParams = { user_id, ...values };
        dispatch(createProject(createParams));
      }}
    >
      {({ values, errors, touched, setFieldTouched }) => (
          <Form className="create-form">
            <header className="create-header">
              <h2>Create Data Request</h2>
            </header>
            <div className="create-fields">
              <Field name="name">
                {({ field, meta }) => 
                  <SimpleInputField
                    className="create-value-container"
                    label="Project Name"
                    input={<input type="text" {...field} />}
                    error={errorObjectForField(errors, touched, 'name')}
                  />}
              </Field>
              <Field name="institution">
                {({ field, meta }) =>
                  <SimpleInputField
                    className="create-value-container"
                    label="Institution"
                    input={<input type="text" {...field} />}
                    error={errorObjectForField(errors, touched, 'institution')}
                  />}
              </Field>
              <Field name="description">
                {({ field, meta }) =>
                  <SimpleInputField
                    className="create-value-container"
                    label="Description" 
                    input={<textarea {...field} />}
                    error={errorObjectForField(errors, touched, 'description')}
                  />}
              </Field>
              <FieldArray name="associated_users_emails">
                  {({ remove, unshift }) => {
                    let addEmail = () => {
                      if (currentEmailInput === '') return;
                      unshift(currentEmailInput);
                      setCurrentEmailInput('');
                    };
                      return <MultiValueField
                          label="Assosciated Users"
                          fieldId="associated_users_emails"
                          className="create-value-container"
                          error={errorObjectForField(errors, touched, 'associated_users_emails')}
                        >
                          {({ valueContainerProps, valueProps, inputProps }) => (<>
                              <div className="create-multi-value-row create-multi-value-values-row" {...valueContainerProps}>
                                {values.associated_users_emails.map((email, index) => {
                                  return <span key={index} {...valueProps}>
                                    <Pill onClose={() => {
                                      setFieldTouched('associated_users_emails', true, false);
                                      remove(index);
                                    }}>
                                      {email}
                                    </Pill>
                                  </span>;
                                })}
                              </div>
                              <div className="create-multi-value-row">
                                <input
                                  {...inputProps}
                                  type="email"
                                  onKeyDown={(e) => { if(e.key === 'Enter') addEmail(); }}
                                  onChange={(e) => setCurrentEmailInput(e.target.value)} value={currentEmailInput}
                                />
                              </div>
                              <div className="create-multi-value-row">
                                <Button buttonType="secondary" label="Add Email" onClick={addEmail} />
                              </div>
                          </>)}
                    </MultiValueField>;
                  }}
              </FieldArray>
              <FieldArray name="filter_set_ids">
                  {({ remove, unshift }) => {
                    let addFilter = (filterSet) => {
                      if (!filterSet) return;
                      unshift(filterSet.id);
                      setOpenAddFilter(false)
                    };
                    return <MultiValueField
                        label="Filter Sets"
                        fieldId="filter_set_ids"
                        className="create-value-container"
                        error={errorObjectForField(errors, touched, 'filter_set_ids')}
                      >
                        {({ valueContainerProps, valueProps }) => (<>
                          <div className="create-multi-value-row create-multi-value-values-row" {...valueContainerProps}>
                            {values.filter_set_ids.map((filter_id, index) => {
                              let filter = filterSets.find((filter) => filter.id === filter_id);
                              return <span key={index} {...valueProps}>
                                <Pill
                                  onClick={() => setViewFilter(filter)}
                                  onClose={() => { setFieldTouched('filter_set_ids', true, false);remove(index); }}
                                >
                                  {filter.name}
                                </Pill>
                              </span>;
                            })}
                          </div>
                          <div className="create-multi-value-row">
                            <Button buttonType="secondary" hasPopup="dialog" label="Add Filter" onClick={() => setOpenAddFilter(true)} />
                          </div>
                          {openAddFilter &&
                            <SimplePopup>
                              <FilterSetOpenForm
                                currentFilterSet={{ name: '', description: '', filter: {} }}
                                filterSets={filterSets}
                                fetchWithToken={fetchWithToken}
                                onAction={addFilter}
                                onClose={() => setOpenAddFilter(false)}
                              />
                            </SimplePopup>
                          }
                          {viewFilter &&
                            <SimplePopup >
                              <ViewFilterDetail
                                filterSet={viewFilter}    
                                onClose={() => setViewFilter(null)}                       
                              />
                            </SimplePopup>
                          }
                      </>)}
                    </MultiValueField>;
                  }}
              </FieldArray>
            </div>
            <Button submit={true} className="create-submit" label="Create" />
          </Form>
      )}
    </Formik>
  </div>;
}
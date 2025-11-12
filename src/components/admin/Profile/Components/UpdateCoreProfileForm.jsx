import React from 'react';
import { FormCard } from './ui/FormCard';
import { FormField } from './ui/FormField';

const UpdateCoreProfileForm = ({ formData, handleChange }) => (
    <FormCard title="Core Profile" icon="✏️" customIndex={1}>
        <FormField
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="e.g. 123 Main St, New Delhi"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                label="Phone Number"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
            />
            <FormField
                label="Total Tables"
                name="tableNumbers"
                type="number"
                min="1"
                value={formData.tableNumbers}
                onChange={handleChange}
                placeholder="e.g. 25"
            />
        </div>
    </FormCard>
);

export default UpdateCoreProfileForm;
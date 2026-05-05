import React from 'react';
import { FormCard } from './commanProfile/FormCard';
import { FormField } from './commanProfile/FormField';

const UpdateCoreProfileForm = ({ formData, handleChange }) => (
    <FormCard title="Restaurant Details" customIndex={1}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
                <FormField
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. 123 Main St, New Delhi"
                />
            </div>
            <FormField
                label="Phone Number"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="e.g. 00000000000"
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

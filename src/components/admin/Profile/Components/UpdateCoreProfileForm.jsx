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
                label="Indoor Tables"
                name="sections.indoor.tables"
                type="number"
                min="0"
                value={formData.sections?.indoor?.tables ?? ""}
                onChange={handleChange}
                placeholder="e.g. 10"
            />
            <FormField
                label="Outdoor Tables"
                name="sections.outdoor.tables"
                type="number"
                min="0"
                value={formData.sections?.outdoor?.tables ?? ""}
                onChange={handleChange}
                placeholder="e.g. 5"
            />
            <FormField
                label="Rooftop Tables"
                name="sections.rooftop.tables"
                type="number"
                min="0"
                value={formData.sections?.rooftop?.tables ?? ""}
                onChange={handleChange}
                placeholder="e.g. 0"
            />
            <FormField
                label="Rooms"
                name="sections.rooms.rooms"
                type="number"
                min="0"
                value={formData.sections?.rooms?.rooms ?? ""}
                onChange={handleChange}
                placeholder="e.g. 0"
            />
        </div>
    </FormCard>
);

export default UpdateCoreProfileForm;

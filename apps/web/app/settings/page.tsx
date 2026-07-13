"use client";

export default function SettingsPage() {
  return (
    <div className="p-container-margin pb-16">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Vertical Tabs */}
        <div className="w-full md:w-48 shrink-0 flex flex-col gap-1">
          <button className="text-left px-3 py-2 rounded-md bg-surface-container-high text-on-surface font-body-md text-body-md font-medium">General</button>
          <button className="text-left px-3 py-2 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-body-md text-body-md">AI Models</button>
          <button className="text-left px-3 py-2 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-body-md text-body-md">Indexing</button>
          <button className="text-left px-3 py-2 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-body-md text-body-md">System Status</button>
        </div>

        {/* Settings Content Panel */}
        <div className="flex-1 space-y-8">
          <div>
            <h2 className="font-headline-md text-headline-md mb-6 border-b border-outline-variant pb-2">General Settings</h2>
            <div className="space-y-6">
              
              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant rounded-lg">
                <div>
                  <h3 className="font-body-lg text-body-lg font-medium text-on-surface">Theme Preference</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Switch between light and dark mode</p>
                </div>
                <div className="flex bg-surface-container p-1 rounded-lg">
                  <button className="px-4 py-1 rounded bg-secondary-container text-on-secondary-container font-label-md text-label-md">Dark</button>
                  <button className="px-4 py-1 rounded text-on-surface-variant hover:text-on-surface font-label-md text-label-md">Light</button>
                </div>
              </div>

              {/* Backend URL */}
              <div className="space-y-2 p-4 bg-surface-container-low border border-outline-variant rounded-lg">
                <label className="font-body-lg text-body-lg font-medium block text-on-surface">Backend URL</label>
                <p className="font-body-md text-body-md text-on-surface-variant mb-2">The endpoint for the CodeAtlas API.</p>
                <input 
                  className="w-full bg-surface-dim border border-outline-variant rounded-md px-3 py-2 text-on-surface font-code-md text-code-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
                  type="text" 
                  defaultValue="http://localhost:8000"
                />
              </div>

              {/* Default Repo */}
              <div className="space-y-2 p-4 bg-surface-container-low border border-outline-variant rounded-lg">
                <label className="font-body-lg text-body-lg font-medium block text-on-surface">Default Repository</label>
                <p className="font-body-md text-body-md text-on-surface-variant mb-2">Select the repository to load on startup.</p>
                <select className="w-full bg-surface-dim border border-outline-variant rounded-md px-3 py-2 text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none">
                  <option>codeatlas-core</option>
                  <option>codeatlas-frontend</option>
                  <option>fastapi-backend</option>
                </select>
              </div>

            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
            <button className="px-4 py-2 rounded-md border border-outline-variant text-on-surface hover:bg-surface-container transition-colors font-label-md text-label-md font-medium">Reset Defaults</button>
            <button className="px-4 py-2 rounded-md bg-primary text-on-primary font-label-md text-label-md font-medium hover:brightness-110 transition-all shadow-[0_0_15px_rgba(173,198,255,0.2)]">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

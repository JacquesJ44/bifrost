import SignupHeader from "./SignupHeader.jsx";
import SignupFooter from "./SignupFooter.jsx";
import { useEffect, useState } from "react";
import api from "./api";
import validator from "email-validator";

export default function SignupPage() {
  const [sites, setSites] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedSite, setSelectedSite] = useState(""); // <-- declare state
  const [selectedUnit, setSelectedUnit] = useState("");

  const packages = ["50/50Mbps - R750", "100/100Mbps - R950", "200/200Mbps - R1 125"]; // default 3 options
  const [selectedPackage, setSelectedPackage] = useState("");

  const [activationType, setActivationType] = useState(""); // "ASAP" or "Scheduled"
  const [activationDate, setActivationDate] = useState(""); // stores date if scheduled

  const [formLoadedAt] = useState(new Date().toISOString());


  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    unit_number: "",
    package: "",
    activation_date: "",
    notes: ""
  });
  const [status, setStatus] = useState(null);

  // Fetch sites on mount
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await api.get("/api/sites");
        setSites(res.data);
        // console.log("Sites from API:", res.data);
      } catch (err) {
        console.error("Failed to fetch sites:", err);
      }
    };

    fetchSites();
  }, []);

  // Fetch units whenever a site is selected
  useEffect(() => {
    if (!selectedSite) return;

    // console.log("Fetching units for site_id:", selectedSite); // <-- log here

    const fetchUnits = async () => {
      try {
        const res = await api.get("/api/units", { params: { site_id: selectedSite } });
        setUnits(res.data);
        console.log("Units from API:", res.data);
      } catch (err) {
        console.error("Failed to fetch units:", err);
      }
    };

    fetchUnits();
  }, [selectedSite]);
  
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async e => {
    e.preventDefault();
    setStatus("loading");
    
    if (!validator.validate(form.email)) {
      setStatus("invalid_email");
      return;
    }
    
    try {
      // Build the payload including the extra fields
      const selectedSiteObj = sites.find(s => s.id === Number(selectedSite));

      const payload = {
        ...form,
        site_id: selectedSite,
        site_name: selectedSiteObj ? selectedSiteObj.name : null,
        unit_number: selectedUnit,
        package: selectedPackage,
        activation_type: activationType,
        activation_date:
          activationType === "Scheduled" ? activationDate : null,

        // bot protection
        company: e.target.company?.value || "",
        form_loaded_at: formLoadedAt
      };

      console.log("Submitting payload:", payload);

      await api.post("/api/signup", payload);
      setStatus("success");

      // Reset form and selections
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        notes: ""
      });
      setSelectedSite("");
      setSelectedUnit("");
      setSelectedPackage("");
      setActivationType("");
      setActivationDate("");
    } catch (err) {
      console.error("Signup failed:", err);
      setStatus("error");
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-base-100">
      {/* Header */}
      <SignupHeader />

      {/* Form section */}
      <main className="grow flex items-center justify-center px-4 py-12 bg-base-100">
        <div className="w-full max-w-lg p-6 bg-base-200 rounded-xl shadow-lg">

          <form onSubmit={submit} className="space-y-4">
            {/* Name fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Honeypot field */}
              <input
                type="text"
                name="company"
                tabIndex="-1"
                autoComplete="off"
                className="absolute left-[-10000px]"
              />              
              <input
                className="input input-bordered w-full"
                name="first_name"
                placeholder="First name"
                value={form.first_name}
                onChange={handleChange}
                required
              />
              <input
                className="input input-bordered w-full"
                name="last_name"
                placeholder="Last name"
                value={form.last_name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Contact fields */}
            <input
              className="input input-bordered w-full"
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              className="input input-bordered w-full"
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
              required
            />

            {/* Site select */}
            <select
              className="select select-bordered w-full"
              name="site"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              required
            >
              <option value="">Select Building Complex</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Unit select */}
            <select
              className="select select-bordered w-full"
              name="unit_number"
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              required
            >
              <option value="">Select Unit Number</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            {/* Package radio buttons */}
            <div>
              <label className="font-semibold mb-2 block">Package</label>
              <div className="flex flex-wrap gap-4">
                {packages
                  .filter(pkg => !(selectedSite === "1" && pkg.startsWith("200/200Mbps - R1 125")))
                  .map((pkg, idx) => (
                    <label className="label cursor-pointer" key={idx}>
                      <input
                        type="radio"
                        name="package"
                        value={pkg}
                        checked={selectedPackage === pkg}
                        onChange={(e) => setSelectedPackage(e.target.value)}
                        className="radio radio-primary mr-2"
                        required
                      />
                      <span className="label-text">{pkg}</span>
                    </label>
                  ))}
              </div>
            </div>


            {/* Activation radio buttons */}
            <div>
              <label className="font-semibold mb-2 block">Activation</label>
              <div className="flex items-center gap-6 mb-2">
                <label className="label cursor-pointer flex items-center">
                  <input
                    type="radio"
                    name="activation"
                    value="ASAP"
                    checked={activationType === "ASAP"}
                    onChange={(e) => setActivationType(e.target.value)}
                    className="radio radio-primary mr-2"
                    required
                  />
                  <span className="label-text">Activate ASAP</span>
                </label>

                <label className="label cursor-pointer flex items-center">
                  <input
                    type="radio"
                    name="activation"
                    value="Scheduled"
                    checked={activationType === "Scheduled"}
                    onChange={(e) => setActivationType(e.target.value)}
                    className="radio radio-primary mr-2"
                    required
                  />
                  <span className="label-text">Schedule Date</span>
                </label>
              </div>

              {activationType === "Scheduled" && (
                <input
                  type="date"
                  name="activation_date"
                  value={activationDate}
                  onChange={(e) => setActivationDate(e.target.value)}
                  className="input input-bordered w-full"
                  min={new Date().toISOString().split("T")[0]} // only future dates
                  required
                />
              )}

              {/* Conditional message */}
              {activationType === "ASAP" && (
                <p className="text-sm text-black mt-2">
                  Activation will occur within 24 hours of debit‑order approval.
                </p>
              )}
              {activationType === "Scheduled" && activationDate && (
                <p className="text-sm text-black mt-2">
                  Activation will take place on {activationDate}, subject to debit‑order approval.
                </p>
              )}
            </div>

            {/* Notes */}
            <textarea
              className="textarea textarea-bordered w-full"
              name="notes"
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={handleChange}
            />

            {/* Submit button */}
            <button
              type="submit"
              disabled={status === "loading"}
              className="btn btn-accent w-full mt-2"
            >
              {status === "loading" ? "Submitting..." : "Submit"}
            </button>
            
            {/* Invalid Email Modal */}
            {status === "invalid_email" && (
              <div className="modal modal-open">
                <div className="modal-box">
                  <h3 className="font-bold text-lg text-red-600">Invalid Email Address</h3>
                  <p className="py-4">
                    Please enter a valid email address so we can contact you.
                  </p>
                  <div className="modal-action">
                    <button
                      className="btn btn-primary"
                      onClick={() => setStatus("")}
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Status Modal */}
            {status === "success" && (
              <div className="modal modal-open">
                <div className="modal-box">
                  <h3 className="font-bold text-lg">Success!</h3>
                  <p className="py-4">Thanks — we’ll be in touch.</p>
                  <div className="modal-action">
                    <button
                      className="btn btn-primary"
                      onClick={() => setStatus("")} // Close modal
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="modal modal-open">
                <div className="modal-box">
                  <h3 className="font-bold text-lg text-red-600">Error</h3>
                  <p className="py-4">Something went wrong. Please try again.</p>
                  <div className="modal-action">
                    <button
                      className="btn btn-primary"
                      onClick={() => setStatus("")} // Close modal
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>

      {/* Footer */}
      <SignupFooter />

    </div>
  );




}

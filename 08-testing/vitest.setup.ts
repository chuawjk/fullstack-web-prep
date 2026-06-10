// This file runs before every test file.
// It imports @testing-library/jest-dom so its custom matchers are available
// everywhere: toBeInTheDocument(), toBeDisabled(), toHaveValue(), etc.
// Python analogy: a conftest.py that installs pytest plugins.

import "@testing-library/jest-dom";

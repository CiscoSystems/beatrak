package logmont

import (
	"fmt"
	"github.com/sirupsen/logrus"
)

// Logger class, extends logrus.Logger
// Adds trace
type Logger struct {
	*logrus.Logger
	trace bool
	preTraceLevel logrus.Level
}

// New initializes the Logger with
// default logrus.New()
func New() *Logger {
	return &Logger{Logger: logrus.New()}
}

// SetTrace triggers tracing on/off
func (this *Logger) SetTrace(yes bool) {
	if yes {
		this.preTraceLevel = this.Level
		this.SetLevel(logrus.DebugLevel)
		this.trace = true
	} else {
		this.SetLevel(this.preTraceLevel)
		this.trace = false
	}
}

// Tracef method implements tracing style when
// SetTrace(true)
func (this *Logger) Tracef(format string, args ...interface{}) {
	if this.trace {
		this.Debugf("TRACE>>>>>" + fmt.Sprintf(format, args...) + "<<<<<TRACE")
	}
}
